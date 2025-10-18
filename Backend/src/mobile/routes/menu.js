import express from 'express';
import { 
  getMobileMenuItems, 
  getMobileMenuItem, 
  getMobileRestaurantMenu 
} from '../controllers/menuController.js';
import { cache } from '../../middleware/cache.js';

const router = express.Router();

// Public routes for mobile app
router.route('/')
  .get(cache(), getMobileMenuItems);

router.route('/:id')
  .get(cache(), getMobileMenuItem);

// Get menu items by restaurant
router.route('/restaurants/:restaurantId/menu')
  .get(cache(), getMobileRestaurantMenu);

export default router;
