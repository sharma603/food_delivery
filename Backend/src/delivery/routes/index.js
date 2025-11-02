/**
 * Delivery Partner Routes Index
 * 
 * This file aggregates all delivery partner routes and follows the same
 * structure as the mobile customer app (src/mobile/routes/index.js)
 * 
 * Routes:
 * - /api/v1/delivery/auth/*     - Authentication (login, register, forgot password, etc.)
 * - /api/v1/delivery/*         - Delivery operations (profile, orders, earnings, etc.)
 */

import express from 'express';
import authRoutes from './auth.js';
import deliveryRoutes from './delivery.js';
import cashCollectionRoutes from './cashCollection.js';

const router = express.Router();

// Authentication routes - /api/v1/delivery/auth
router.use('/auth', authRoutes);

// Cash collection routes - /api/v1/delivery/cash
router.use('/cash', cashCollectionRoutes);

// Delivery person routes - /api/v1/delivery
router.use('/', deliveryRoutes);

export default router;

