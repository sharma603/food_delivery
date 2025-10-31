import express from 'express';
import {
  getDeliveryProfile,
  updateDeliveryProfile,
  updateDeliveryStatus,
  updateDeliveryLocation,
  getAvailableOrders,
  getMyOrders,
  getOrderDetails,
  acceptOrder,
  pickupOrder,
  deliverOrder,
  cancelOrder,
  getEarnings,
  getEarningsHistory,
  getPerformance,
  getStats,
  getDashboard,
  getNotifications,
  markNotificationRead
} from '../controllers/deliveryPersonController.js';

import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply delivery person authorization to all routes
router.use(authorize('delivery'));

// Profile routes
router.get('/profile', getDeliveryProfile);
router.put('/profile', updateDeliveryProfile);

// Status and Location routes
router.put('/status', updateDeliveryStatus);
router.put('/location', updateDeliveryLocation);

// Order routes
router.get('/orders/available', getAvailableOrders);
router.get('/orders/my-orders', getMyOrders);
router.get('/orders/:orderId', getOrderDetails);
router.post('/orders/:orderId/accept', acceptOrder);
router.post('/orders/:orderId/pickup', pickupOrder);
router.post('/orders/:orderId/deliver', deliverOrder);
router.post('/orders/:orderId/cancel', cancelOrder);

// Earnings routes
router.get('/earnings', getEarnings);
router.get('/earnings/history', getEarningsHistory);

// Analytics routes
router.get('/performance', getPerformance);
router.get('/stats', getStats);
router.get('/dashboard', getDashboard);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:notificationId/read', markNotificationRead);

export default router;

