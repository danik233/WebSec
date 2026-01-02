// server/middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/upload.config');

// Ensure upload directories exist
const ensureDirectories = () => {
  [config.uploadDir, config.tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
  });
};

ensureDirectories();

// Configure storage - use memory storage for validation, then save manually
const storage = multer.memoryStorage();

// File filter - initial basic check (real validation happens after)
const fileFilter = (req, file, cb) => {
  // Basic check on original filename
  const ext = path.extname(file.originalname).toLowerCase();
  
  const allowedExts = Object.values(config.allowedTypes)
    .flatMap(type => type.extensions);
  
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`File extension ${ext} not allowed`), false);
  }
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize,
    files: config.maxFilesPerRequest
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        maxSize: `${config.maxFileSize / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        maxFiles: config.maxFilesPerRequest
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

/**
 * Generate secure random filename with UUID
 */
const generateSecureFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
};

/**
 * Save validated file to secure location
 */
const saveFile = async (buffer, filename) => {
  const filePath = path.join(config.uploadDir, filename);
  
  // Ensure filename doesn't escape upload directory
  const resolvedPath = path.resolve(filePath);
  const uploadDirResolved = path.resolve(config.uploadDir);
  
  if (!resolvedPath.startsWith(uploadDirResolved)) {
    throw new Error('Path traversal attempt detected');
  }
  
  await fs.promises.writeFile(filePath, buffer, { mode: 0o644 });
  return filePath;
};

module.exports = {
  upload,
  handleMulterError,
  generateSecureFilename,
  saveFile
};