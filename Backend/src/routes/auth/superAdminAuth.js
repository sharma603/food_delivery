// Super Admin Auth Routes
// This file structure created as per requested organization
import express from 'express';

import { 
  superAdminLogin, 
  superAdminLogout, 
  superAdminRegister,
  superAdminForgotPassword,
  superAdminVerifyOTP,
  superAdminResetPassword
} from '../../controllers/auth/superAdminAuthController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', superAdminLogin);
router.post('/forgot-password', superAdminForgotPassword);
router.post('/verify-otp', superAdminVerifyOTP);
router.post('/reset-password', superAdminResetPassword);

// Protected routes (only SuperAdmin can access)
router.post('/register', protect, authorize('super_admin'), superAdminRegister);
router.post('/logout', protect, authorize('super_admin'), superAdminLogout);

export default router;
