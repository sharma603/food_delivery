// Common Upload Routes
// This file structure created as per requested organization
import express from 'express';
import multer from 'multer';
import { protect } from '../../middleware/auth.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../services/storage/cloudinaryService.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// @desc    Upload single file
// @route   POST /api/common/upload/single
// @access  Private
router.post('/single', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await uploadToCloudinary(req.file.path, {
      folder: req.body.folder || 'general',
      resource_type: 'auto'
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        filename: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
});

// @desc    Upload multiple files
// @route   POST /api/common/upload/multiple
// @access  Private
router.post('/multiple', protect, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.path, {
        folder: req.body.folder || 'general',
        resource_type: 'auto'
      })
    );

    const results = await Promise.all(uploadPromises);

    const uploadedFiles = results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.files[index].originalname,
      size: req.files[index].size
    }));

    res.json({
      success: true,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
});

// @desc    Delete file
// @route   DELETE /api/common/upload/:publicId
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    await deleteFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      message: 'File deletion failed'
    });
  }
});

export default router;
