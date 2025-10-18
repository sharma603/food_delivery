import express from 'express';
import {
  getRestaurantsForVerification,
  getRestaurantForVerification,
  verifyRestaurant,
  getVerificationStats,
  bulkVerifyRestaurants,
  updateVerificationStatus
} from '../controllers/restaurantVerificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and require admin or super_admin authorization
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// GET /api/admin/restaurants/verification - Get restaurants for verification
router.get('/', getRestaurantsForVerification);

// GET /api/admin/restaurants/verification/stats - Get verification statistics
router.get('/stats', getVerificationStats);

// GET /api/admin/restaurants/verification/:id - Get single restaurant for verification
router.get('/:id', getRestaurantForVerification);

// PUT /api/admin/restaurants/verification/:id - Verify restaurant (approve/reject)
router.put('/:id', verifyRestaurant);

// PUT /api/admin/restaurants/verification/bulk - Bulk verify restaurants
router.put('/bulk', bulkVerifyRestaurants);

// PATCH /api/admin/restaurants/verification/:id/status - Update verification status
router.patch('/:id/status', updateVerificationStatus);

export default router;