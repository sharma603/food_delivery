import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  getOrderHistory,
  acceptOrder,
  rejectOrder,
  markAsReady
} from '../../controllers/restaurant/orderController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('restaurant'));

// Restaurant order management routes
router.route('/')
  .get(getRestaurantOrders);

router.route('/stats')
  .get(getOrderStats);

router.route('/history')
  .get(getOrderHistory);

router.route('/:id')
  .get(getOrderById)
  .put(updateOrderStatus);

router.route('/:id/accept')
  .put(acceptOrder);

router.route('/:id/reject')
  .put(rejectOrder);

router.route('/:id/ready')
  .put(markAsReady);

export default router;
