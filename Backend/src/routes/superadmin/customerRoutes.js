import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
  getCustomerAnalytics
} from '../../controllers/superadmin/customerController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('super_admin'));

// Customer management routes
router.get('/', getAllCustomers);
router.get('/analytics', getCustomerAnalytics);
router.get('/:id', getCustomerById);
router.put('/:id/status', updateCustomerStatus);
router.delete('/:id', deleteCustomer);

export default router;
