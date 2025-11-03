import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import menuUpload from '../../middleware/menuUpload.js';
import {
  getRestaurantMenuItems,
  getRestaurantMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemStatus
} from '../../controllers/restaurant/menuController.js';

const router = express.Router();

// All routes require restaurant authentication
router.use(protect);
router.use(authorize('restaurant'));

// Menu item routes
router.route('/items')
  .get(getRestaurantMenuItems)
  .post(menuUpload.array('images', 5), createMenuItem);

router.route('/items/:itemId')
  .get(getRestaurantMenuItem)
  .put(menuUpload.array('images', 5), updateMenuItem)
  .delete(deleteMenuItem);

router.patch('/items/:itemId/toggle-status', toggleMenuItemStatus);

export default router;
