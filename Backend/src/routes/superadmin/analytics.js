import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getOrderAnalytics,
  getRestaurantAnalytics,
  getCustomerAnalytics,
  getSystemAnalytics,
  exportAnalytics,
  getRealTimeMetrics
} from '../../controllers/superadmin/analyticsController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('super_admin'));

// Analytics routes
router.route('/dashboard')
  .get(getDashboardAnalytics);

router.route('/revenue')
  .get(getRevenueAnalytics);

router.route('/orders')
  .get(getOrderAnalytics);

router.route('/restaurants')
  .get(getRestaurantAnalytics);

router.route('/customers')
  .get(getCustomerAnalytics);

router.route('/system')
  .get(getSystemAnalytics);

router.route('/realtime')
  .get(getRealTimeMetrics);

router.route('/export')
  .post(exportAnalytics);

export default router;
