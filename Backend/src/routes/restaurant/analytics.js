// Restaurant Analytics Routes
import express from 'express';
import {
  getDashboardAnalytics,
  getSalesAnalytics,
  getMenuPerformance,
  getCustomerAnalytics,
  getOperationalMetrics,
  exportAnalytics
} from '../../controllers/restaurant/analyticsController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes are protected and require restaurant or super_admin authorization
router.use(protect);
router.use(authorize('restaurant', 'super_admin'));

// @route   GET /api/v1/restaurant/analytics/dashboard
// @desc    Get comprehensive analytics dashboard
// @access  Private (Restaurant)
router.get('/dashboard', getDashboardAnalytics);

// @route   GET /api/v1/restaurant/analytics/sales
// @desc    Get sales analytics with trends
// @access  Private (Restaurant)
router.get('/sales', getSalesAnalytics);

// @route   GET /api/v1/restaurant/analytics/menu
// @desc    Get menu performance analytics
// @access  Private (Restaurant)
router.get('/menu', getMenuPerformance);

// @route   GET /api/v1/restaurant/analytics/customers
// @desc    Get customer analytics
// @access  Private (Restaurant)
router.get('/customers', getCustomerAnalytics);

// @route   GET /api/v1/restaurant/analytics/operations
// @desc    Get operational metrics
// @access  Private (Restaurant)
router.get('/operations', getOperationalMetrics);

// @route   GET /api/v1/restaurant/analytics/export
// @desc    Export analytics data to CSV
// @access  Private (Restaurant)
router.get('/export', exportAnalytics);

export default router;

