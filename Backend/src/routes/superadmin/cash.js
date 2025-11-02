import express from 'express';
import {
  getPendingSubmissions,
  reconcileCash,
  bulkReconcileCash,
  getCashReport,
  getAllDeliveryPersonnelCash
} from '../../delivery/controllers/cashReconciliationController.js';

const router = express.Router();

// Cash reconciliation routes for SuperAdmin
router.get('/pending', getPendingSubmissions);
router.get('/report', getCashReport);
router.get('/delivery-personnel', getAllDeliveryPersonnelCash); // Get all delivery personnel with cash details
router.post('/reconcile/:collectionId', reconcileCash);
router.post('/reconcile/bulk', bulkReconcileCash);

export default router;

