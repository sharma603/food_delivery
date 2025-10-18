import express from 'express';
import {
  getRestaurantStatusHistory,
  getCurrentRestaurantStatus
} from '../controllers/restaurantStatusController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Restaurant status routes (for restaurant owners)
router.route('/history')
  .get(protect, authorize('restaurant'), getRestaurantStatusHistory);

router.route('/current')
  .get(protect, authorize('restaurant'), getCurrentRestaurantStatus);

export default router;
