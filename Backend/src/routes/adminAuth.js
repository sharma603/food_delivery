import express from 'express';
import {
  adminLogin,
  createAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  adminLogout
} from '../controllers/adminAuthController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes (All Admin types)
router.get('/me', protect, authorize('admin'), getAdminProfile);
router.put('/profile', protect, authorize('admin'), updateAdminProfile);
router.put('/change-password', protect, authorize('admin'), changeAdminPassword);
router.post('/logout', protect, authorize('admin'), adminLogout);

// System settings routes (Super Admin only or system_settings permission)
router.post('/create', protect, authorize('admin'), (req, res, next) => {
  // Only super admin or admin with system_settings permission can create new admins
  if (req.user.role === 'super_admin' || (req.user.permissions && req.user.permissions.includes('system_settings'))) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin role or system_settings permission required.'
    });
  }
}, createAdmin);

export default router;