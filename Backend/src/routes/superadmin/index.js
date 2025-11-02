import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';

// Import all superadmin routes
import dashboardRoutes from './dashboard.js';
import restaurantRoutes from './restaurants.js';
import menuRoutes from './menu.js';
import customerRoutes from './customerRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import systemRoutes from './system.js';
import orderRoutes from './orders.js';
import analyticsRoutes from './analytics.js';
import userManagementRoutes from './userManagement.js';
import paymentRoutes from './payments.js';
import notificationRoutes from './notifications.js';
import disputeRoutes from './disputes.js';
import cashRoutes from './cash.js';

const router = express.Router();

// Apply authentication and authorization to all superadmin routes
router.use(protect);
router.use(authorize('super_admin'));

// Mount all superadmin routes
router.use('/dashboard', dashboardRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/customers', customerRoutes);
router.use('/categories', categoryRoutes);
router.use('/system', systemRoutes);
router.use('/orders', orderRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userManagementRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/disputes', disputeRoutes);
router.use('/cash', cashRoutes);

export default router;
