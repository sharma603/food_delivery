// Super Admin Dashboard Routes
// This file structure created as per requested organization
import express from 'express';
import { getDashboardOverview } from '../../controllers/superadmin/dashboardController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require super admin authentication
router.use(protect);
router.use(authorize('super_admin'));

// Dashboard routes
router.get('/', getDashboardOverview);

export default router;
