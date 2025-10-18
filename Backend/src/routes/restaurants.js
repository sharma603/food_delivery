import express from 'express';
import cache from '../middleware/cache.js';

const router = express.Router();

import { protect, authorize } from '../middleware/auth.js';

import { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, getAllMenuItems } from '../controllers/restaurantController.js';

router.route('/').get(cache(), getRestaurants).post(protect, authorize('restaurant'), createRestaurant);

router.route('/menu-items').get(cache(), getAllMenuItems);

router.route('/:id').get(cache(), getRestaurant).put(protect, updateRestaurant).delete(protect, deleteRestaurant);

export default router;