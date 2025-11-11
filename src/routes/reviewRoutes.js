import express from 'express';
import {
  createReview,
  getOfferReviews,
  getPartnerReviews,
  respondToReview,
} from '../controllers/reviewController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - View reviews for an offer (alternative route)
router.get('/offers/:offerId', getOfferReviews);

// Member routes - Create reviews
router.post('/', verifyToken, verifyRole('member'), createReview);

// Partner routes - View and respond to reviews
router.get('/partner', verifyToken, verifyRole('partner'), getPartnerReviews);
router.put('/:id/respond', verifyToken, verifyRole('partner'), respondToReview);

export default router;

