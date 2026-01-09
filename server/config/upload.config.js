// server/config/upload.config.js
const path = require('path');

module.exports = {
  // Storage configuration
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  tempDir: process.env.TEMP_DIR || path.join(__dirname, '../../temp'),
  
  // Size limits (in bytes)
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE) || 30 * 1024 * 1024, // 30MB
  maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST) || 3,
  
  // SSRF Protection - URL upload limits
  maxUploadBytesFromUrl: parseInt(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024, // 10MB
  
  // Allowed file types with their magic bytes
  allowedTypes: {
    'pdf': { 
      extensions: ['.pdf'],
      mimeTypes: ['application/pdf'],
      magicBytes: [[0x25, 0x50, 0x44, 0x46]] // %PDF
    },
    'jpg': { 
      extensions: ['.jpg', '.jpeg'],
      mimeTypes: ['image/jpeg'],
      magicBytes: [[0xFF, 0xD8, 0xFF]]
    },
    'png': { 
      extensions: ['.png'],
      mimeTypes: ['image/png'],
      magicBytes: [[0x89, 0x50, 0x4E, 0x47]]
    },
    'gif': { 
      extensions: ['.gif'],
      mimeTypes: ['image/gif'],
      magicBytes: [[0x47, 0x49, 0x46, 0x38]]
    },
    'txt': { 
      extensions: ['.txt'],
      mimeTypes: ['text/plain'],
      magicBytes: null // Text files don't have consistent magic bytes
    },
    'zip': { 
      extensions: ['.zip'],
      mimeTypes: ['application/zip'],
      magicBytes: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]]
    }
  },
  
  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 10,
  
  // Security
  allowPublicAccess: false,
  requireAuth: true,
  scanForMalware: false // Set to true if you have AV integration
};