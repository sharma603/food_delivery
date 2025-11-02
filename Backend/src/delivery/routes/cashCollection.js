import express from 'express';
import {
  recordCashCollection,
  submitCash,
  getCashSummary,
  getCashHistory
} from '../controllers/cashCollectionController.js';
import { protect, authorize } from '../../middleware/auth.js';
import cashUpload from '../../middleware/cashUpload.js';

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('delivery'));

// Cash collection routes
router.post('/collect', recordCashCollection);
router.post('/submit', cashUpload.single('depositProof'), submitCash);
router.get('/summary', getCashSummary);
router.get('/history', getCashHistory);

export default router;

