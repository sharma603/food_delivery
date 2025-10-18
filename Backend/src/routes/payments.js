import express from 'express';

const router = express.Router();

import { protect } from '../middleware/auth.js';

import { getPayments, getPayment, createPayment, updatePayment, stripeWebhook } from '../controllers/paymentController.js';

router.post('/webhook/stripe', stripeWebhook);

router.route('/').get(protect, getPayments).post(protect, createPayment);

router.route('/:id').get(protect, getPayment).put(protect, updatePayment);

export default router;