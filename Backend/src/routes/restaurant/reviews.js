import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getRestaurantReviews,
  getReviewById,
  respondToReview,
  getReviewStats,
  getReviewAnalytics,
  reportReview,
  getReviewHistory
} from '../../controllers/restaurant/reviewController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('restaurant'));

// Restaurant review management routes
router.route('/')
  .get(getRestaurantReviews);

router.route('/stats')
  .get(getReviewStats);

router.route('/analytics')
  .get(getReviewAnalytics);

router.route('/history')
  .get(getReviewHistory);

router.route('/:id')
  .get(getReviewById);

router.route('/:id/respond')
  .put(respondToReview);

router.route('/:id/report')
  .post(reportReview);

export default router;
