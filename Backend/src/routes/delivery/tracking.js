import express from 'express';
import {
  getActiveDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  updateDeliveryLocation,
  addDeliveryDelay,
  getTrackingStats,
  getDeliveryHistory,
  getDeliveriesByPersonnel,
  getDeliveriesByZone,
  assignDeliveryToPersonnel,
  getDelayedDeliveries,
  bulkUpdateDeliveryStatus
} from '../../controllers/delivery/trackingController.js';

import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply superadmin authorization to all routes
router.use(authorize(['super_admin']));

// GET /api/v1/superadmin/delivery/tracking/active - Get active deliveries
router.get('/active', getActiveDeliveries);

// GET /api/v1/superadmin/delivery/tracking/stats - Get tracking statistics
router.get('/stats', getTrackingStats);

// GET /api/v1/superadmin/delivery/tracking/history - Get delivery history
router.get('/history', getDeliveryHistory);

// GET /api/v1/superadmin/delivery/tracking/delayed - Get delayed deliveries
router.get('/delayed', getDelayedDeliveries);

// GET /api/v1/superadmin/delivery/tracking/personnel/:personnelId - Get deliveries by personnel
router.get('/personnel/:personnelId', getDeliveriesByPersonnel);

// GET /api/v1/superadmin/delivery/tracking/zone/:zoneId - Get deliveries by zone
router.get('/zone/:zoneId', getDeliveriesByZone);

// GET /api/v1/superadmin/delivery/tracking/:deliveryId - Get delivery by ID
router.get('/:deliveryId', getDeliveryById);

// PUT /api/v1/superadmin/delivery/tracking/:deliveryId/status - Update delivery status
router.put('/:deliveryId/status', updateDeliveryStatus);

// PUT /api/v1/superadmin/delivery/tracking/:deliveryId/location - Update delivery location
router.put('/:deliveryId/location', updateDeliveryLocation);

// PUT /api/v1/superadmin/delivery/tracking/:deliveryId/delay - Add delivery delay
router.put('/:deliveryId/delay', addDeliveryDelay);

// PUT /api/v1/superadmin/delivery/tracking/:deliveryId/assign - Assign delivery to personnel
router.put('/:deliveryId/assign', assignDeliveryToPersonnel);

// PUT /api/v1/superadmin/delivery/tracking/bulk/status - Bulk update delivery status
router.put('/bulk/status', bulkUpdateDeliveryStatus);

export default router;
