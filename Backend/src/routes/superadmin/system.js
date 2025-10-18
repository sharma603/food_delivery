// SuperAdmin System Administration Routes
import express from 'express';
import {
  getSystemDashboard,
  getSystemMenuManagement,
  getSystemPageManagement,
  getSystemUserManagement,
  getSystemSettings,
  updateSystemSettings
} from '../../controllers/superadmin/systemController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require super admin authentication
router.use(protect);
router.use(authorize('super_admin'));

// System Dashboard
router.get('/dashboard', getSystemDashboard);

// Menu Management
router.get('/menu', getSystemMenuManagement);

// Page Management
router.get('/pages', getSystemPageManagement);

// User Management
router.get('/users', getSystemUserManagement);

// System Settings
router.route('/settings')
  .get(getSystemSettings)
  .put(updateSystemSettings);

export default router;
