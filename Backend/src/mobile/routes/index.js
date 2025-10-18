import express from 'express';
import restaurantRoutes from './restaurants.js';
import menuRoutes from './menu.js';
import categoryRoutes from './categories.js';
import authRoutes from './auth.js';
import orderRoutes from './orders.js';
import offerRoutes from './offers.js';

const router = express.Router();

// Mount mobile routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu-items', menuRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/offers', offerRoutes);

export default router;
