import express from 'express';
import {
  browseOffers,
  getOffer,
  getOfferReviews,
  getCategories,
  clickOffer,
} from '../controllers/memberController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - no authentication required
// Optional authentication for tracking purposes
router.get('/offers', optionalAuth, browseOffers);
router.get('/offers/categories', getCategories);
router.get('/offers/:id', optionalAuth, getOffer);
router.get('/offers/:id/reviews', getOfferReviews);
router.post('/offers/:id/click', optionalAuth, clickOffer);

export default router;

