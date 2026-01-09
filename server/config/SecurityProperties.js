// server/config/SecurityProperties.js

/**
 * Security configuration for SSRF protection
 * Loads trusted domains and size limits from environment variables
 */
class SecurityProperties {
    constructor() {
        // Load trusted domains from .env (comma-separated)
        // Example: TRUSTED_DOMAINS=www.pexels.com,www.istockphoto.com
        const domains = process.env.TRUSTED_DOMAINS || '';
        this.trustedDomains = new Set(
            domains.split(',')
                .map(d => d.trim())
                .filter(d => d.length > 0)
        );

        // Maximum upload size in bytes (default: 10MB)
        this.maxUploadBytes = parseInt(process.env.MAX_UPLOAD_BYTES || '10485760', 10);

        // Validate configuration on startup
        this.validate();
    }

    validate() {
        if (this.trustedDomains.size === 0) {
            console.warn('⚠️  WARNING: No trusted domains configured. SSRF protection is DISABLED.');
            console.warn('⚠️  Set TRUSTED_DOMAINS in your .env file');
        }

        if (this.maxUploadBytes <= 0 || this.maxUploadBytes > 50 * 1024 * 1024) {
            throw new Error('Invalid MAX_UPLOAD_BYTES. Must be between 1 and 50MB');
        }

        console.log(`🔒 SSRF Protection enabled with ${this.trustedDomains.size} trusted domain(s)`);
        console.log(`📏 Max upload size: ${(this.maxUploadBytes / 1024 / 1024).toFixed(2)}MB`);
    }

    getTrustedDomains() {
        return this.trustedDomains;
    }

    getMaxUploadBytes() {
        return this.maxUploadBytes;
    }

    isTrustedDomain(hostname) {
        const normalized = hostname.toLowerCase().trim();
        return this.trustedDomains.has(normalized);
    }
}

// Export singleton instance
module.exports = new SecurityProperties();