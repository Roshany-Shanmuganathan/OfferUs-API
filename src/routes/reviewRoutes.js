import express from 'express';
import {
  createReview,
  getOfferReviews,
  getPartnerReviews,
  respondToReview,
} from '../controllers/reviewController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - View reviews for an offer (alternative route)
router.get('/offers/:offerId', getOfferReviews);

// Member routes - Create reviews
router.post('/', verifyToken, requireRole('member'), createReview);

// Partner routes - View and respond to reviews
router.get('/partner', verifyToken, requireRole('partner'), getPartnerReviews);
router.put('/:id/respond', verifyToken, requireRole('partner'), respondToReview);

export default router;

