import express from 'express';
import cache from '../middleware/cache.js';
import { getAllMenuItems, getPublicCategories } from '../controllers/restaurantController.js';

const router = express.Router();

// Get all menu items aggregated from all restaurants
router.route('/').get(cache(), getAllMenuItems);

// Get all public categories (for customer app)
router.route('/categories').get(cache(), getPublicCategories);

export default router;