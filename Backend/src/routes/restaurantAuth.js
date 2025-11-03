import express from 'express';
import {
  restaurantRegister,
  restaurantLogin,
  getRestaurantProfile,
  updateRestaurantProfile,
  changeRestaurantPassword,
  toggleRestaurantStatus,
  initializeRestaurantStatus,
  restaurantForgotPassword,
  restaurantVerifyOTP,
  restaurantResetPassword
} from '../controllers/restaurantAuthController.js';
import { protect, authorize } from '../middleware/auth.js';
import { restaurantRegistrationUpload } from '../middleware/restaurantUpload.js';

const router = express.Router();

// Debug middleware for public routes
router.use('/forgot-password', (req, res, next) => {
  console.log('✅ Forgot password route matched - public route');
  next();
});
router.use('/verify-otp', (req, res, next) => {
  console.log('✅ Verify OTP route matched - public route');
  next();
});
router.use('/reset-password', (req, res, next) => {
  console.log('✅ Reset password route matched - public route');
  next();
});

// Public routes
router.post('/register', restaurantRegistrationUpload, restaurantRegister);
router.post('/login', restaurantLogin);
router.post('/forgot-password', restaurantForgotPassword);
router.post('/verify-otp', restaurantVerifyOTP);
router.post('/reset-password', restaurantResetPassword);

// Protected routes (Restaurant only)
router.get('/me', protect, authorize('restaurant'), getRestaurantProfile);
router.put('/profile', protect, authorize('restaurant'), updateRestaurantProfile);
router.put('/change-password', protect, authorize('restaurant'), changeRestaurantPassword);
router.post('/init-status', protect, authorize('restaurant'), initializeRestaurantStatus);
router.put('/toggle-status', protect, authorize('restaurant'), toggleRestaurantStatus);

export default router;