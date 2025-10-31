import express from 'express';
import {
  deliveryLogin,
  refreshDeliveryToken,
  getDeliveryMe,
  updateDeliveryProfile,
  changeDeliveryPassword,
  deliveryLogout,
  deliveryForgotPassword,
  deliveryVerifyOTP,
  deliveryResetPassword
} from '../controllers/deliveryAuthController.js';
import { protect, authorize } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/security.js';

const router = express.Router();

// Public routes
router.post('/login', deliveryLogin); // Removed authLimiter temporarily
router.post('/refresh', refreshDeliveryToken);
router.post('/forgot-password', deliveryForgotPassword);
router.post('/verify-otp', deliveryVerifyOTP);
router.post('/reset-password', deliveryResetPassword);

// Protected routes (Delivery Personnel only)
router.get('/me', protect, authorize('delivery'), getDeliveryMe);
router.put('/profile', protect, authorize('delivery'), updateDeliveryProfile);
router.put('/change-password', protect, authorize('delivery'), changeDeliveryPassword);
router.post('/logout', protect, authorize('delivery'), deliveryLogout);

export default router;

