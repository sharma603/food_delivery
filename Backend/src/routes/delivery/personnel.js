import express from 'express';
import {
  getAllPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  updatePersonnelStatus,
  updatePersonnelLocation,
  getAvailablePersonnel,
  getPersonnelStats,
  bulkUpdatePersonnelStatus,
  getPersonnelPerformance
} from '../../delivery/controllers/personnelController.js';

import { protect, authorize } from '../../middleware/auth.js';
import { validatePersonnel, validatePersonnelUpdate } from '../../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply superadmin authorization to all routes
router.use(authorize('super_admin'));

// GET /api/v1/superadmin/delivery/personnel - Get all personnel
router.get('/', getAllPersonnel);

// GET /api/v1/superadmin/delivery/personnel/stats - Get personnel statistics
router.get('/stats', getPersonnelStats);

// GET /api/v1/superadmin/delivery/personnel/available/:zoneId - Get available personnel for zone
router.get('/available/:zoneId', getAvailablePersonnel);

// GET /api/v1/superadmin/delivery/personnel/:personnelId - Get personnel by ID
router.get('/:personnelId', getPersonnelById);

// GET /api/v1/superadmin/delivery/personnel/:personnelId/performance - Get personnel performance
router.get('/:personnelId/performance', getPersonnelPerformance);

// POST /api/v1/superadmin/delivery/personnel - Create new personnel
router.post('/', validatePersonnel, createPersonnel);

// PUT /api/v1/superadmin/delivery/personnel/:personnelId - Update personnel
router.put('/:personnelId', validatePersonnelUpdate, updatePersonnel);

// DELETE /api/v1/superadmin/delivery/personnel/:personnelId - Delete personnel
router.delete('/:personnelId', deletePersonnel);

// PUT /api/v1/superadmin/delivery/personnel/:personnelId/status - Update personnel status
router.put('/:personnelId/status', updatePersonnelStatus);

// PUT /api/v1/superadmin/delivery/personnel/:personnelId/location - Update personnel location
router.put('/:personnelId/location', updatePersonnelLocation);

// PUT /api/v1/superadmin/delivery/personnel/bulk/status - Bulk update personnel status
router.put('/bulk/status', bulkUpdatePersonnelStatus);

export default router;
