import express from 'express';
import { 
  mobileRegister, 
  mobileLogin, 
  mobileGetProfile, 
  mobileUpdateProfile, 
  mobileChangePassword, 
  mobileLogout,
  mobileForgotPassword,
  mobileVerifyOTP,
  mobileResetPassword,
  mobileVerifyResetToken
} from '../controllers/authController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', mobileRegister);
router.post('/login', mobileLogin);
router.post('/forgot-password', mobileForgotPassword);
router.post('/verify-otp', mobileVerifyOTP);
router.post('/reset-password', mobileResetPassword);
router.get('/verify-reset-token/:token', mobileVerifyResetToken);

// Protected routes (require authentication)
router.get('/profile', protect, mobileGetProfile);
router.put('/profile', protect, mobileUpdateProfile);
router.put('/change-password', protect, mobileChangePassword);
router.post('/logout', protect, mobileLogout);

export default router;
