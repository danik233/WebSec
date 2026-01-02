// server/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');
const fileUploadController = require('../controllers/fileUpload.controller');

// Apply rate limiter to all upload routes
router.use(uploadLimiter);

/**
 * @route   POST /api/upload/single
 * @desc    Upload a single file
 * @access  Public
 */
router.post(
    '/single',
    upload.single('file'),
    handleMulterError,
    fileUploadController.uploadSingle
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files (max 3)
 * @access  Public
 */
router.post(
    '/multiple',
    upload.array('files', 3),
    handleMulterError,
    fileUploadController.uploadMultiple
);

/**
 * @route   GET /api/upload/download/:fileId
 * @desc    Download a file by ID
 * @access  Public (checks isPublic flag)
 */
router.get(
    '/download/:fileId',
    optionalAuth,
    fileUploadController.downloadFile
);

/**
 * @route   GET /api/upload/files
 * @desc    List all files
 * @access  Public (only shows public files)
 */
router.get(
    '/files',
    optionalAuth,
    fileUploadController.listFiles
);

/**
 * @route   DELETE /api/upload/:fileId
 * @desc    Delete a file
 * @access  Private (requires auth - currently disabled)
 */
router.delete(
    '/:fileId',
    fileUploadController.deleteFile
);

module.exports = router;