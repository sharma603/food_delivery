import express from 'express';
import {
  getAllRestaurants,
  createRestaurant,
  generateRestaurantCredentials,
  updateRestaurantStatus,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantStatusStats
} from '../../controllers/superadmin/restaurantController.js';
import { protect, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All routes require super admin authentication
router.use(protect);
router.use(authorize('super_admin'));

// Restaurant management routes
router.route('/')
  .get(getAllRestaurants)
  .post(createRestaurant);

router.route('/status/stats')
  .get(getRestaurantStatusStats);

router.route('/:id/credentials')
  .post(generateRestaurantCredentials);

router.route('/:id/status')
  .put(updateRestaurantStatus);

router.route('/:id')
  .put(updateRestaurant)
  .delete(deleteRestaurant);

export default router;
