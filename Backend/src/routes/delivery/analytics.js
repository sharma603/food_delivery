import express from 'express';
import {
  getOverallStats,
  getZonePerformance,
  getPersonnelPerformance,
  getTimeAnalytics,
  getDeliveryTrends,
  getTopZones,
  getTopPersonnel,
  getZoneAnalytics,
  getPersonnelAnalytics,
  getRevenueAnalytics,
  getCustomerSatisfactionAnalytics,
  generateAnalyticsReport
} from '../../controllers/delivery/analyticsController.js';

import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply superadmin authorization to all routes
router.use(authorize(['super_admin']));

// GET /api/v1/superadmin/delivery/analytics/overall - Get overall statistics
router.get('/overall', getOverallStats);

// GET /api/v1/superadmin/delivery/analytics/zones - Get zone performance
router.get('/zones', getZonePerformance);

// GET /api/v1/superadmin/delivery/analytics/personnel - Get personnel performance
router.get('/personnel', getPersonnelPerformance);

// GET /api/v1/superadmin/delivery/analytics/time - Get time analytics
router.get('/time', getTimeAnalytics);

// GET /api/v1/superadmin/delivery/analytics/trends - Get delivery trends
router.get('/trends', getDeliveryTrends);

// GET /api/v1/superadmin/delivery/analytics/top-zones - Get top performing zones
router.get('/top-zones', getTopZones);

// GET /api/v1/superadmin/delivery/analytics/top-personnel - Get top performing personnel
router.get('/top-personnel', getTopPersonnel);

// GET /api/v1/superadmin/delivery/analytics/revenue - Get revenue analytics
router.get('/revenue', getRevenueAnalytics);

// GET /api/v1/superadmin/delivery/analytics/satisfaction - Get customer satisfaction analytics
router.get('/satisfaction', getCustomerSatisfactionAnalytics);

// GET /api/v1/superadmin/delivery/analytics/zone/:zoneId - Get detailed zone analytics
router.get('/zone/:zoneId', getZoneAnalytics);

// GET /api/v1/superadmin/delivery/analytics/personnel/:personnelId - Get detailed personnel analytics
router.get('/personnel/:personnelId', getPersonnelAnalytics);

// GET /api/v1/superadmin/delivery/analytics/report - Generate analytics report
router.get('/report', generateAnalyticsReport);

export default router;
