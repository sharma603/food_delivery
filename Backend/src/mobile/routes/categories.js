import express from 'express';
import { 
  getMobileCategories, 
  getMobilePopularCategories, 
  getMobileCategoryMenuItems 
} from '../controllers/categoryController.js';
import { cache } from '../../middleware/cache.js';

const router = express.Router();

// Public routes for mobile app
router.route('/')
  .get(cache(), getMobileCategories);

router.route('/popular')
  .get(cache(), getMobilePopularCategories);

router.route('/:categoryId/menu-items')
  .get(cache(), getMobileCategoryMenuItems);

export default router;
