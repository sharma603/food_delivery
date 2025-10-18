import express from 'express';
import {
  restaurantRegister,
  restaurantLogin,
  getRestaurantProfile,
  updateRestaurantProfile,
  changeRestaurantPassword,
  toggleRestaurantStatus,
  initializeRestaurantStatus
} from '../controllers/restaurantAuthController.js';
import { protect, authorize } from '../middleware/auth.js';
import { restaurantRegistrationUpload } from '../middleware/restaurantUpload.js';

const router = express.Router();

// Public routes
router.post('/register', restaurantRegistrationUpload, restaurantRegister);
router.post('/login', restaurantLogin);

// Protected routes (Restaurant only)
router.get('/me', protect, authorize('restaurant'), getRestaurantProfile);
router.put('/profile', protect, authorize('restaurant'), updateRestaurantProfile);
router.put('/change-password', protect, authorize('restaurant'), changeRestaurantPassword);
router.post('/init-status', protect, authorize('restaurant'), initializeRestaurantStatus);
router.put('/toggle-status', protect, authorize('restaurant'), toggleRestaurantStatus);

export default router;