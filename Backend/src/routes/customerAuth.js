import express from 'express';
import {
  customerRegister,
  customerLogin,
  getCustomerProfile,
  updateCustomerProfile,
  addCustomerAddress,
  changeCustomerPassword,
  getAllCustomerAddresses,
  getCustomerAddress,
  addNewCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress
} from '../controllers/customerAuthController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', customerRegister);
router.post('/login', customerLogin);

// Protected routes (Customer only)
router.get('/me', protect, authorize('customer'), getCustomerProfile);
router.put('/profile', protect, authorize('customer'), updateCustomerProfile);
router.post('/address', protect, authorize('customer'), addCustomerAddress);
router.put('/change-password', protect, authorize('customer'), changeCustomerPassword);

// Address management routes (new)
router.get('/addresses', protect, authorize('customer'), getAllCustomerAddresses);
router.post('/addresses', protect, authorize('customer'), addNewCustomerAddress);
router.get('/addresses/:addressId', protect, authorize('customer'), getCustomerAddress);
router.put('/addresses/:addressId', protect, authorize('customer'), updateCustomerAddress);
router.delete('/addresses/:addressId', protect, authorize('customer'), deleteCustomerAddress);

export default router;