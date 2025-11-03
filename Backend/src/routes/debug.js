/**
 * Debug routes for checking file paths and image serving
 * Only enable in development or for troubleshooting
 */
import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// @route   GET /api/debug/uploads-check
// @desc    Check uploads directory and file paths
// @access  Public (remove in production)
router.get('/uploads-check', (req, res) => {
  try {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const menuItemsPath = path.join(process.cwd(), 'uploads', 'menu-items');
    
    const info = {
      currentWorkingDirectory: process.cwd(),
      uploadsPath: uploadsPath,
      menuItemsPath: menuItemsPath,
      uploadsExists: fs.existsSync(uploadsPath),
      menuItemsExists: fs.existsSync(menuItemsPath),
      uploadsReadable: fs.existsSync(uploadsPath) ? fs.accessSync(uploadsPath, fs.constants.R_OK) === undefined : false,
      menuItemsReadable: fs.existsSync(menuItemsPath) ? fs.accessSync(menuItemsPath, fs.constants.R_OK) === undefined : false,
    };

    // Get sample files if directory exists
    if (info.menuItemsExists) {
      try {
        const files = fs.readdirSync(menuItemsPath);
        info.menuItemsFiles = files.slice(0, 10); // Show first 10 files
        info.menuItemsCount = files.length;
        
        // Get details of first file
        if (files.length > 0) {
          const firstFile = files[0];
          const firstFilePath = path.join(menuItemsPath, firstFile);
          const stats = fs.statSync(firstFilePath);
          info.sampleFile = {
            name: firstFile,
            path: firstFilePath,
            url: `/uploads/menu-items/${firstFile}`,
            size: stats.size,
            modified: stats.mtime
          };
        }
      } catch (error) {
        info.readError = error.message;
      }
    }

    res.json({
      success: true,
      data: info,
      message: 'Uploads directory check completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/debug/test-image/:filename
// @desc    Test if a specific image can be accessed
// @access  Public (remove in production)
router.get('/test-image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(process.cwd(), 'uploads', 'menu-items', filename);
    
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      res.json({
        success: true,
        filename: filename,
        path: imagePath,
        url: `/uploads/menu-items/${filename}`,
        exists: true,
        size: stats.size,
        modified: stats.mtime
      });
    } else {
      res.status(404).json({
        success: false,
        filename: filename,
        path: imagePath,
        exists: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
