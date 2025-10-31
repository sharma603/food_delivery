/**
 * Delivery Boy Order Routes
 */

import express from 'express';
import {
  getDeliveryBoyOrders,
  getDeliveryOrderDetail,
  updateDeliveryStatus,
  getDeliveryStats,
  acceptOrder,
  sendDeliveryOtp,
  resendDeliveryOtp,
  submitDeliveryProof,
  verifyDeliveryOtp
} from '../controllers/deliveryOrderController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get delivery statistics
router.get('/stats', getDeliveryStats);

// Get all orders assigned to delivery boy
router.get('/', getDeliveryBoyOrders);

// Accept an order
router.post('/:id/accept', acceptOrder);

// Get single order details
router.get('/:id', getDeliveryOrderDetail);

// Update order status
router.put('/:id/status', updateDeliveryStatus);

// Delivery confirmation OTP
router.post('/:id/send-otp', sendDeliveryOtp);
router.post('/:id/resend-otp', resendDeliveryOtp);
router.post('/:id/otp/verify', verifyDeliveryOtp);

// Proof (OTP/photos)
router.post('/:id/proof', submitDeliveryProof);

export default router;

