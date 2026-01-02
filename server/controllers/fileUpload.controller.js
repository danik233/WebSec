// server/controllers/fileUpload.controller.js
const fileValidationService = require('../services/fileValidation.service');
const { generateSecureFilename, saveFile } = require('../middleware/upload.middleware');
const File = require('../modules/file.model');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/upload.config');

class FileUploadController {
  
  /**
   * Upload single file
   */
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }
      
      // Validate file
      const validation = await fileValidationService.validateFile(req.file);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: validation.errors
        });
      }
      
      // Generate secure filename
      const secureFilename = generateSecureFilename(req.file.originalname);
      const fileId = secureFilename.replace(path.extname(secureFilename), '');
      
      // Save file to secure location
      await saveFile(req.file.buffer, secureFilename);
      
      // Save metadata to database
      const fileDoc = new File({
        fileId: fileId,
        originalName: req.file.originalname,
        secureName: secureFilename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.user?._id || null,
        userEmail: req.user?.email || null,
        uploadedBy: req.user?.email || req.ip,
        isPublic: true
      });
      
      await fileDoc.save();
      
      // Log upload event
      console.log(`📁 File uploaded: ${secureFilename} by ${req.user?.email || req.ip}`);
      
      // Return metadata
      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          id: fileId,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          uploadedAt: fileDoc.uploadedAt
        }
      });
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Upload multiple files
   */
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }
      
      // Validate all files
      const validation = await fileValidationService.validateFiles(req.files);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: validation.errors
        });
      }
      
      // Process each file
      const uploadedFiles = [];
      
      for (const file of req.files) {
        const secureFilename = generateSecureFilename(file.originalname);
        const fileId = secureFilename.replace(path.extname(secureFilename), '');
        
        await saveFile(file.buffer, secureFilename);
        
        // Save to database
        const fileDoc = new File({
          fileId: fileId,
          originalName: file.originalname,
          secureName: secureFilename,
          mimeType: file.mimetype,
          size: file.size,
          userId: req.user?._id || null,
          userEmail: req.user?.email || null,
          uploadedBy: req.user?.email || req.ip,
          isPublic: true
        });
        
        await fileDoc.save();
        
        uploadedFiles.push({
          id: fileId,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: fileDoc.uploadedAt
        });
      }
      
      console.log(`📁 ${uploadedFiles.length} files uploaded by ${req.user?.email || req.ip}`);
      
      return res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        files: uploadedFiles
      });
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Download file
   */
  async downloadFile(req, res) {
    try {
      const { fileId } = req.params;
      
      console.log(`📥 Download request for file: ${fileId}`);
      
      // Find file in database
      const fileDoc = await File.findOne({ fileId });
      
      if (!fileDoc) {
        console.log(`❌ File not found in database: ${fileId}`);
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
      
      // Authorization check: allow public files
      if (!fileDoc.isPublic) {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }
        
        const isOwner = req.user.email === fileDoc.userEmail;
        const isAdmin = req.user.role === 'ADMIN';
        
        if (!isOwner && !isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }
      
      const filePath = path.join(config.uploadDir, fileDoc.secureName);
      
      // Security: Prevent path traversal
      const resolvedPath = path.resolve(filePath);
      const uploadDirResolved = path.resolve(config.uploadDir);
      
      if (!resolvedPath.startsWith(uploadDirResolved)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      // Check if file exists on disk
      try {
        await fs.access(filePath);
      } catch {
        console.log(`❌ File not found on disk: ${filePath}`);
        return res.status(404).json({
          success: false,
          error: 'File not found on disk'
        });
      }
      
      // Update download statistics
      fileDoc.downloadCount += 1;
      fileDoc.lastAccessedAt = new Date();
      await fileDoc.save();
      
      console.log(`✅ Downloading file: ${fileDoc.originalName}`);
      
      // Send file with proper headers
      res.download(filePath, fileDoc.originalName, (err) => {
        if (err) {
          console.error('❌ Download error:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Download failed'
            });
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Download error:', error);
      return res.status(500).json({
        success: false,
        error: 'Download failed'
      });
    }
  }
  
  /**
   * List files - SIMPLIFIED VERSION
   */
  async listFiles(req, res) {
    try {
      console.log('📋 List files endpoint called');
      
      // Show all public files (no authentication required for now)
      const files = await File.find({ isPublic: true })
        .select('-__v')
        .sort({ uploadedAt: -1 })
        .limit(100);
      
      console.log(`✅ Found ${files.length} files`);
      
      return res.status(200).json({
        success: true,
        count: files.length,
        files: files.map(f => ({
          id: f.fileId,
          originalName: f.originalName,
          size: f.size,
          mimeType: f.mimeType,
          uploadedAt: f.uploadedAt,
          downloadCount: f.downloadCount || 0,
          isPublic: f.isPublic
        }))
      });
      
    } catch (error) {
      console.error('❌ List files error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to list files',
        message: error.message
      });
    }
  }
  
  /**
   * Delete file
   */
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      
      console.log(`🗑️ Delete request for file: ${fileId}`);
      
      // Find file in database
      const fileDoc = await File.findOne({ fileId });
      
      if (!fileDoc) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
      
      // For now, allow anyone to delete (remove this in production)
      // Authorization: only owner or admin can delete
      /* 
      if (req.user) {
        const isOwner = req.user.email === fileDoc.userEmail;
        const isAdmin = req.user.role === 'ADMIN';
        
        if (!isOwner && !isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      */
      
      const filePath = path.join(config.uploadDir, fileDoc.secureName);
      
      // Security check
      const resolvedPath = path.resolve(filePath);
      const uploadDirResolved = path.resolve(config.uploadDir);
      
      if (!resolvedPath.startsWith(uploadDirResolved)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      // Delete file from disk
      try {
        await fs.unlink(filePath);
        console.log(`✅ Deleted file from disk: ${filePath}`);
      } catch (err) {
        console.warn(`⚠️ File not found on disk: ${filePath}`);
      }
      
      // Delete from database
      await File.deleteOne({ fileId });
      
      console.log(`✅ File deleted from database: ${fileId}`);
      
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  }
}

module.exports = new FileUploadController();