import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  bulkMenuOperations,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuAnalytics
} from '../../controllers/superadmin/menuController.js';

const router = express.Router();

// Ensure uploads directory exists - Use absolute path
const uploadsDir = path.join(process.cwd(), 'uploads', 'menu-items');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created menu-items upload directory:', uploadsDir);
} else {
  console.log('✅ Menu-items upload directory exists:', uploadsDir);
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(0 * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `menu-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Menu Items Routes
router.route('/')
  .get(getAllMenuItems)
  .post(createMenuItem);

router.route('/analytics')
  .get(getMenuAnalytics);

router.route('/bulk')
  .post(bulkMenuOperations);

router.route('/:id')
  .get(getMenuItem)
  .put(upload.array('images', 5), updateMenuItem)
  .delete(deleteMenuItem);

// Categories Routes
router.route('/categories')
  .get(getAllCategories)
  .post(createCategory);

router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

export default router;
