import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  getOrderAnalytics,
  exportOrders,
  getOrderDisputes,
  resolveOrderDispute,
  processRefund,
  getRefundHistory
} from '../../controllers/superadmin/orderController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('super_admin'));

// Order management routes
router.route('/')
  .get(getAllOrders)
  .post(exportOrders);

router.route('/stats')
  .get(getOrderStats);

router.route('/analytics')
  .get(getOrderAnalytics);

router.route('/:id')
  .get(getOrderById)
  .put(updateOrderStatus);

// Order disputes
router.route('/disputes')
  .get(getOrderDisputes);

router.route('/disputes/:id/resolve')
  .put(resolveOrderDispute);

// Refund management
router.route('/refunds')
  .post(processRefund)
  .get(getRefundHistory);

export default router;
