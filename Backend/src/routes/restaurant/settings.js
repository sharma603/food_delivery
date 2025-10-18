import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getRestaurantSettings,
  updateRestaurantSettings,
  updatePassword,
  updateNotificationSettings,
  getRestaurantPreferences,
  updateRestaurantPreferences,
  getRestaurantSecurity,
  updateRestaurantSecurity
} from '../../controllers/restaurant/settingsController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('restaurant'));

// Restaurant settings management routes
router.route('/')
  .get(getRestaurantSettings)
  .put(updateRestaurantSettings);

router.route('/password')
  .put(updatePassword);

router.route('/notifications')
  .put(updateNotificationSettings);

router.route('/preferences')
  .get(getRestaurantPreferences)
  .put(updateRestaurantPreferences);

router.route('/security')
  .get(getRestaurantSecurity)
  .put(updateRestaurantSecurity);

export default router;
