import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';

// Import all restaurant routes
import dashboardRoutes from './dashboard.js';
import menuRoutes from './menu.js';
import analyticsRoutes from './analytics.js';
import orderRoutes from './orders.js';
import profileRoutes from './profile.js';
import settingsRoutes from './settings.js';
import reviewsRoutes from './reviews.js';
import earningsRoutes from './earnings.js';

const router = express.Router();

// Apply authentication and authorization to all restaurant routes
router.use(protect);
router.use(authorize('restaurant'));

// Mount all restaurant routes
router.use('/dashboard', dashboardRoutes);
router.use('/menu', menuRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/orders', orderRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/earnings', earningsRoutes);

export default router;
