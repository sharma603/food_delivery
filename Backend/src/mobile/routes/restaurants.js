import express from 'express';
import { getMobileRestaurants, getMobileRestaurant } from '../controllers/restaurantController.js';
import { cache } from '../../middleware/cache.js';

const router = express.Router();

// Public routes for mobile app
router.route('/')
  .get(cache(), getMobileRestaurants);

router.route('/:id')
  .get(cache(), getMobileRestaurant);

export default router;
