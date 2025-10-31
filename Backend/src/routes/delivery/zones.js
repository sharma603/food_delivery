import express from 'express';
import {
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getZoneStats,
  findZoneByArea,
  findZoneByPincode,
  bulkUpdateZoneStatus,
  getZonePerformance
} from '../../delivery/controllers/zoneController.js';

import { protect, authorize } from '../../middleware/auth.js';
import { validateZone } from '../../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply superadmin authorization to all routes
router.use(authorize('super_admin'));

// GET /api/v1/superadmin/delivery/zones - Get all zones
router.get('/', getAllZones);

// GET /api/v1/superadmin/delivery/zones/stats - Get zone statistics
router.get('/stats', getZoneStats);

// GET /api/v1/superadmin/delivery/zones/area/:area - Find zone by area
router.get('/area/:area', findZoneByArea);

// GET /api/v1/superadmin/delivery/zones/pincode/:pincode - Find zone by pincode
router.get('/pincode/:pincode', findZoneByPincode);

// GET /api/v1/superadmin/delivery/zones/:zoneId - Get zone by ID
router.get('/:zoneId', getZoneById);

// GET /api/v1/superadmin/delivery/zones/:zoneId/performance - Get zone performance
router.get('/:zoneId/performance', getZonePerformance);

// POST /api/v1/superadmin/delivery/zones - Create new zone
router.post('/', validateZone, createZone);

// PUT /api/v1/superadmin/delivery/zones/:zoneId - Update zone
router.put('/:zoneId', validateZone, updateZone);

// DELETE /api/v1/superadmin/delivery/zones/:zoneId - Delete zone
router.delete('/:zoneId', deleteZone);

// PUT /api/v1/superadmin/delivery/zones/bulk/status - Bulk update zone status
router.put('/bulk/status', bulkUpdateZoneStatus);

export default router;
