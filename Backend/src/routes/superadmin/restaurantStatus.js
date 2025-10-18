import express from 'express';
import {
  getAllRestaurantsStatus,
  getRestaurantStatusStats,
  getRestaurantStatusById
} from '../../controllers/restaurantStatusController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Super Admin restaurant status routes
router.route('/')
  .get(protect, authorize('superadmin'), getAllRestaurantsStatus);

router.route('/stats')
  .get(protect, authorize('superadmin'), getRestaurantStatusStats);

router.route('/:id')
  .get(protect, authorize('superadmin'), getRestaurantStatusById);

export default router;
