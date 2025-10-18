import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  updateRestaurantSettings,
  uploadRestaurantImage,
  getRestaurantStats,
  updateRestaurantHours,
  updateRestaurantLocation
} from '../../controllers/restaurant/profileController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('restaurant'));

// Restaurant profile management routes
router.route('/')
  .get(getRestaurantProfile)
  .put(updateRestaurantProfile);

router.route('/settings')
  .put(updateRestaurantSettings);

router.route('/stats')
  .get(getRestaurantStats);

router.route('/image')
  .post(uploadRestaurantImage);

router.route('/hours')
  .put(updateRestaurantHours);

router.route('/location')
  .put(updateRestaurantLocation);

export default router;
