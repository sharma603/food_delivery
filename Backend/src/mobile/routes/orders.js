import express from 'express';
import { 
  getMobileCustomerOrders, 
  getMobileOrder, 
  createMobileOrder, 
  cancelMobileOrder 
} from '../controllers/orderController.js';
import { protect } from '../../middleware/auth.js';
import { createOrder, getOrder } from '../../controllers/orderController.js';

const router = express.Router();

// Guest order creation and retrieval (no authentication required)
router.route('/guest').post(createOrder);
router.route('/guest/:id').get(getOrder);

// All other routes are protected (require authentication)
router.use(protect);

// Customer order routes
router.route('/')
  .get(getMobileCustomerOrders)
  .post(createMobileOrder);

router.route('/:id')
  .get(getMobileOrder);

router.route('/:id/cancel')
  .put(cancelMobileOrder);

export default router;
