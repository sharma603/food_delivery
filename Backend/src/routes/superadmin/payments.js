import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  processPayout,
  getPayoutHistory,
  getTransactionHistory,
  exportPayments,
  getPaymentAnalytics
} from '../../controllers/superadmin/paymentController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('super_admin'));

// Payment management routes
router.route('/')
  .get(getAllPayments);

router.route('/stats')
  .get(getPaymentStats);

router.route('/analytics')
  .get(getPaymentAnalytics);

router.route('/export')
  .post(exportPayments);

router.route('/:id')
  .get(getPaymentById);

// Payout management
router.route('/payouts')
  .post(processPayout)
  .get(getPayoutHistory);

// Transaction history
router.route('/transactions')
  .get(getTransactionHistory);

export default router;
