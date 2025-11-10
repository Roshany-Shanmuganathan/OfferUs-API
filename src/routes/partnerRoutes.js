import express from 'express';
import {
  getPartnerProfile,
  updatePartnerProfile,
  createOffer,
  getPartnerOffers,
  getPartnerOffer,
  updateOffer,
  deleteOffer,
  getPartnerAnalytics,
  getPartnerReviews,
  respondToReview,
} from '../controllers/partnerController.js';
import { protect, isPartnerOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and partner ownership
router.use(protect);
router.use(isPartnerOwner);

// Partner profile routes
router.route('/profile')
  .get(getPartnerProfile)
  .put(updatePartnerProfile);

// Offer routes
router.route('/offers')
  .get(getPartnerOffers)
  .post(createOffer);

router.route('/offers/:id')
  .get(getPartnerOffer)
  .put(updateOffer)
  .delete(deleteOffer);

// Analytics route
router.get('/analytics', getPartnerAnalytics);

// Review routes
router.get('/reviews', getPartnerReviews);
router.put('/reviews/:id/respond', respondToReview);

export default router;

