import express from 'express';
import {
  getAllDisputes,
  getDisputeById,
  updateDisputeStatus,
  assignDispute,
  addDisputeComment,
  resolveDispute,
  getDisputeAnalytics,
  exportDisputes
} from '../../controllers/superadmin/disputeController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('super_admin'));

// @route   GET /api/v1/superadmin/disputes/analytics
router.get('/analytics', getDisputeAnalytics);

// @route   POST /api/v1/superadmin/disputes/export
router.post('/export', exportDisputes);

// @route   GET /api/v1/superadmin/disputes
router.get('/', getAllDisputes);

// @route   GET /api/v1/superadmin/disputes/:id
router.get('/:id', getDisputeById);

// @route   PUT /api/v1/superadmin/disputes/:id/status
router.put('/:id/status', updateDisputeStatus);

// @route   PUT /api/v1/superadmin/disputes/:id/assign
router.put('/:id/assign', assignDispute);

// @route   POST /api/v1/superadmin/disputes/:id/comments
router.post('/:id/comments', addDisputeComment);

// @route   POST /api/v1/superadmin/disputes/:id/resolve
router.post('/:id/resolve', resolveDispute);

export default router;
