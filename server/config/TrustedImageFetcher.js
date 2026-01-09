// server/services/TrustedImageFetcher.js

const https = require('https');
const dns = require('dns').promises;
const { URL } = require('url');
const securityProperties = require('../config/SecurityProperties');

/**
 * Secure image fetcher with comprehensive SSRF protection
 * 
 * Protection layers:
 * 1. HTTPS-only enforcement
 * 2. Trusted domain allowlist
 * 3. DNS resolution with IP verification
 * 4. DNS pinning (prevent TOCTOU attacks)
 * 5. No redirects
 * 6. Content-Type validation
 * 7. Size limits
 */
class TrustedImageFetcher {
    constructor() {
        this.securityConfig = securityProperties;
    }

    /**
     * Fetch an image from a trusted HTTPS URL
     * @param {string} userUrl - User-provided URL
     * @returns {Promise<Buffer>} - Image data as buffer
     * @throws {Error} - On any security violation
     */
    async fetchHttpsFromTrustedDomain(userUrl) {
        // Layer A: Parse and validate HTTPS URL
        const uri = this.parseHttpsUrl(userUrl);
        
        // Layer B: Check trusted domain allowlist
        this.requireTrustedHost(uri.hostname);
        
        // Layer C: Resolve DNS and verify IPs are not private/local
        const verifiedIps = await this.resolveAndVerifyIps(uri.hostname);
        
        // Layer D: Fetch with DNS pinning (use verified IPs only)
        const imageData = await this.fetchWithPinnedDns(uri, verifiedIps);
        
        return imageData;
    }

    /**
     * Layer A: Parse URL and enforce HTTPS
     */
    parseHttpsUrl(userUrl) {
        if (!userUrl || typeof userUrl !== 'string') {
            throw new Error('URL is required');
        }

        let uri;
        try {
            uri = new URL(userUrl);
        } catch (err) {
            throw new Error('Invalid URL format');
        }

        // HTTPS only
        if (uri.protocol !== 'https:') {
            throw new Error('Only HTTPS URLs are allowed');
        }

        // Reject userinfo (user:pass@host)
        if (uri.username || uri.password) {
            throw new Error('URLs with credentials are not allowed');
        }

        // Reject non-standard ports (optional hardening)
        if (uri.port && uri.port !== '443') {
            throw new Error('Only standard HTTPS port (443) is allowed');
        }

        return uri;
    }

    /**
     * Layer B: Verify host is in trusted allowlist
     */
    requireTrustedHost(hostname) {
        const normalized = hostname.toLowerCase().trim();

        if (!this.securityConfig.isTrustedDomain(normalized)) {
            throw new Error(`Untrusted domain: ${hostname}. Only allowed domains: ${Array.from(this.securityConfig.getTrustedDomains()).join(', ')}`);
        }
    }

    /**
     * Layer C: Resolve DNS and verify IPs are safe
     */
    async resolveAndVerifyIps(hostname) {
        let addresses;
        try {
            // Resolve both IPv4 and IPv6
            const ipv4Promise = dns.resolve4(hostname).catch(() => []);
            const ipv6Promise = dns.resolve6(hostname).catch(() => []);
            
            const [ipv4, ipv6] = await Promise.all([ipv4Promise, ipv6Promise]);
            addresses = [...ipv4, ...ipv6];
        } catch (err) {
            throw new Error(`DNS resolution failed for ${hostname}: ${err.message}`);
        }

        if (addresses.length === 0) {
            throw new Error(`No IP addresses found for ${hostname}`);
        }

        // Verify each IP is not private/local/reserved
        for (const ip of addresses) {
            this.verifyIpNotPrivate(ip);
        }

        return addresses;
    }

    /**
     * Verify IP is not in private/local/reserved ranges
     */
    verifyIpNotPrivate(ip) {
        // IPv4 private ranges
        const privateIPv4Ranges = [
            /^127\./,                    // Loopback
            /^10\./,                     // Private
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private
            /^192\.168\./,               // Private
            /^169\.254\./,               // Link-local
            /^0\./,                      // Current network
            /^224\./,                    // Multicast
            /^240\./,                    // Reserved
        ];

        // IPv6 private ranges
        const privateIPv6Ranges = [
            /^::1$/,                     // Loopback
            /^fe80:/i,                   // Link-local
            /^fc00:/i,                   // ULA (Unique Local)
            /^fd00:/i,                   // ULA
        ];

        // Check IPv4
        for (const range of privateIPv4Ranges) {
            if (range.test(ip)) {
                throw new Error(`Private/reserved IP blocked: ${ip}`);
            }
        }

        // Check IPv6
        for (const range of privateIPv6Ranges) {
            if (range.test(ip)) {
                throw new Error(`Private/reserved IPv6 blocked: ${ip}`);
            }
        }
    }

    /**
     * Layer D: Fetch with DNS pinning
     * Forces the HTTP client to use only pre-verified IPs
     */
    async fetchWithPinnedDns(uri, verifiedIps) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: uri.hostname,
                path: uri.pathname + uri.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'TrustedImageFetcher/1.0'
                },
                timeout: 10000, // 10 second timeout
                
                // Layer D: DNS Pinning
                // Use pre-verified IP, prevent new DNS lookups
                lookup: (hostname, options, callback) => {
                    // Force use of our verified IP
                    const ip = verifiedIps[0]; // Use first verified IP
                    callback(null, ip, options.family || 4);
                }
            };

            const req = https.request(options, (res) => {
                // Layer E: No redirects (we handle status codes ourselves)
                if (res.statusCode >= 300 && res.statusCode < 400) {
                    reject(new Error('Redirects are not allowed'));
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode} error`));
                    return;
                }

                // Layer F: Validate Content-Type
                const contentType = res.headers['content-type'] || '';
                if (!contentType.startsWith('image/')) {
                    reject(new Error(`Invalid content type: ${contentType}. Expected image/*`));
                    return;
                }

                // Layer F: Check Content-Length
                const contentLength = parseInt(res.headers['content-length'] || '0', 10);
                const maxBytes = this.securityConfig.getMaxUploadBytes();
                
                if (contentLength > maxBytes) {
                    reject(new Error(`File too large: ${contentLength} bytes (max: ${maxBytes})`));
                    return;
                }

                // Collect response data
                const chunks = [];
                let totalBytes = 0;

                res.on('data', (chunk) => {
                    totalBytes += chunk.length;
                    
                    // Layer F: Enforce size limit during download
                    if (totalBytes > maxBytes) {
                        req.destroy();
                        reject(new Error(`Download exceeded size limit: ${maxBytes} bytes`));
                        return;
                    }
                    
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });

                res.on('error', (err) => {
                    reject(new Error(`Response error: ${err.message}`));
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Request error: ${err.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }
}

// Export singleton instance
module.exports = new TrustedImageFetcher();