import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getRestaurantEarnings,
  getEarningsStats,
  getEarningsHistory,
  getEarningsAnalytics,
  requestPayout,
  getPayoutHistory,
  getEarningsBreakdown,
  exportEarnings
} from '../../controllers/restaurant/earningsController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('restaurant'));

// Restaurant earnings management routes
router.route('/')
  .get(getRestaurantEarnings);

router.route('/stats')
  .get(getEarningsStats);

router.route('/history')
  .get(getEarningsHistory);

router.route('/analytics')
  .get(getEarningsAnalytics);

router.route('/breakdown')
  .get(getEarningsBreakdown);

router.route('/export')
  .post(exportEarnings);

// Payout management
router.route('/payouts')
  .post(requestPayout)
  .get(getPayoutHistory);

export default router;
