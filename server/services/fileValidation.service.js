// server/services/fileValidation.service.js
const fs = require('fs').promises;
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const config = require('../config/upload.config');

class FileValidationService {
  
  /**
   * Sanitize filename - remove dangerous characters and prevent path traversal
   */
  sanitizeFilename(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }
    
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limit length
    const ext = path.extname(sanitized);
    const basename = path.basename(sanitized, ext);
    const maxLength = 200;
    
    if (basename.length > maxLength) {
      return basename.substring(0, maxLength) + ext;
    }
    
    return sanitized;
  }
  
  /**
   * Validate file extension against allowlist
   */
  isAllowedExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    for (const type of Object.values(config.allowedTypes)) {
      if (type.extensions.includes(ext)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check magic bytes of file to verify actual file type
   */
  async validateMagicBytes(buffer, expectedExtension) {
    // Get file type from buffer
    const detectedType = await fileTypeFromBuffer(buffer);
    
    // Find config for expected extension
    const ext = expectedExtension.toLowerCase();
    let typeConfig = null;
    
    for (const [key, value] of Object.entries(config.allowedTypes)) {
      if (value.extensions.includes(ext)) {
        typeConfig = value;
        break;
      }
    }
    
    if (!typeConfig) {
      return { valid: false, reason: 'Extension not in allowlist' };
    }
    
    // Special case: text files
    if (typeConfig.magicBytes === null) {
      return { valid: true };
    }
    
    // Check if detected type matches expected
    if (!detectedType) {
      return { valid: false, reason: 'Could not detect file type' };
    }
    
    const mimeMatches = typeConfig.mimeTypes.includes(detectedType.mime);
    
    if (!mimeMatches) {
      return { 
        valid: false, 
        reason: `File mime type ${detectedType.mime} does not match extension ${ext}` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate file size
   */
  validateFileSize(size) {
    if (size > config.maxFileSize) {
      return { 
        valid: false, 
        reason: `File size ${size} bytes exceeds maximum ${config.maxFileSize} bytes` 
      };
    }
    return { valid: true };
  }
  
  /**
   * Comprehensive file validation
   */
  async validateFile(file) {
    const errors = [];
    
    // 1. Check file exists
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }
    
    // 2. Validate filename
    try {
      const sanitized = this.sanitizeFilename(file.originalname);
      file.safeName = sanitized;
    } catch (err) {
      errors.push(`Invalid filename: ${err.message}`);
    }
    
    // 3. Check extension allowlist
    if (!this.isAllowedExtension(file.originalname)) {
      const ext = path.extname(file.originalname);
      errors.push(`File extension ${ext} is not allowed`);
    }
    
    // 4. Validate file size
    const sizeCheck = this.validateFileSize(file.size);
    if (!sizeCheck.valid) {
      errors.push(sizeCheck.reason);
    }
    
    // 5. Check magic bytes
    if (file.buffer) {
      const ext = path.extname(file.originalname);
      const magicCheck = await this.validateMagicBytes(file.buffer, ext);
      if (!magicCheck.valid) {
        errors.push(magicCheck.reason);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate batch of files
   */
  async validateFiles(files) {
    if (!Array.isArray(files)) {
      files = [files];
    }
    
    // Check number of files
    if (files.length > config.maxFilesPerRequest) {
      return {
        valid: false,
        errors: [`Too many files. Maximum ${config.maxFilesPerRequest} allowed`]
      };
    }
    
    // Validate each file
    const results = await Promise.all(
      files.map(file => this.validateFile(file))
    );
    
    // Collect all errors
    const allErrors = results.flatMap((r, idx) => 
      r.errors.map(err => `File ${idx + 1}: ${err}`)
    );
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      fileResults: results
    };
  }
}

module.exports = new FileValidationService();