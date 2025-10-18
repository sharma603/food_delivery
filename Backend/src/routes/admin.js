import express from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllRestaurants,
  verifyRestaurant,
  rejectRestaurant,
  getAllOrders,
  getAnalytics
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard & Analytics - All admins can view
router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/analytics', protect, authorize('admin'), checkPermission('view_analytics'), getAnalytics);

// User Management - Requires manage_users permission
router.get('/users', protect, authorize('admin'), checkPermission('manage_users'), getAllUsers);
router.put('/users/:userId', protect, authorize('admin'), checkPermission('manage_users'), updateUser);
router.delete('/users/:userId', protect, authorize('admin'), checkPermission('manage_users'), deleteUser);

// Restaurant Management - Requires manage_restaurants permission
router.get('/restaurants', protect, authorize('admin'), checkPermission('manage_restaurants'), getAllRestaurants);
router.put('/restaurants/:restaurantId/verify', protect, authorize('admin'), checkPermission('manage_restaurants'), verifyRestaurant);
router.put('/restaurants/:restaurantId/reject', protect, authorize('admin'), checkPermission('manage_restaurants'), rejectRestaurant);

// Order Management - Requires manage_orders permission
router.get('/orders', protect, authorize('admin'), checkPermission('manage_orders'), getAllOrders);

export default router;