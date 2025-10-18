import express from 'express';
import { getRestaurantDashboard } from '../../controllers/restaurant/dashboardController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require restaurant authentication
router.use(protect);
router.use(authorize('restaurant'));

// Dashboard routes
router.get('/', getRestaurantDashboard);

export default router;