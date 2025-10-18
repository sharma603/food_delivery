import express from 'express';

const router = express.Router();

import { protect, authorize } from '../middleware/auth.js';

import { getOrders, getOrder, createOrder, updateOrder, deleteOrder } from '../controllers/orderController.js';

// Guest order creation (no authentication required for testing)
router.route('/guest').post(createOrder);

// Authenticated routes
router.route('/').get(protect, getOrders).post(protect, createOrder);

router.route('/:id').get(protect, getOrder).put(protect, updateOrder).delete(protect, deleteOrder);

export default router;