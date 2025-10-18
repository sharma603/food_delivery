import express from 'express';
import {
  getMobileOffers,
  getMobileOffer,
  getMobileCoupons,
  validateMobileCoupon,
  getMobileRestaurantOffers
} from '../controllers/offerController.js';

const router = express.Router();

// Get all active offers
router.get('/', getMobileOffers);

// Get specific offer
router.get('/:id', getMobileOffer);

// Get all active coupons
router.get('/coupons/list', getMobileCoupons);

// Validate coupon code
router.post('/coupons/validate', validateMobileCoupon);

// Get offers for specific restaurant
router.get('/restaurants/:restaurantId', getMobileRestaurantOffers);

export default router;
