import express from 'express';
import {
  browseOffers,
  getOffer,
  clickOffer,
  getCategories,
  createOffer,
  getPartnerOffers,
  getPartnerOffer,
  updateOffer,
  deleteOffer,
  redeemOffer,
} from '../controllers/offerController.js';
import { getOfferReviews } from '../controllers/reviewController.js';
import { verifyToken, verifyRole, verifyPartnerApproved, optionalAuth } from '../middleware/authMiddleware.js';
import { sendError } from '../utils/responseFormat.js';

const router = express.Router();

// Public routes - Specific routes must come before parameterized routes
router.get('/categories', getCategories);
router.get('/', optionalAuth, browseOffers);

// Partner-specific routes (must come before /:id routes)
router.post('/', verifyToken, verifyRole('partner'), verifyPartnerApproved, createOffer);
router.get('/partner/my-offers', verifyToken, verifyRole('partner'), verifyPartnerApproved, getPartnerOffers);
router.get('/partner/:id', verifyToken, verifyRole('partner'), verifyPartnerApproved, getPartnerOffer);

// Public routes with parameters
router.get('/:id', optionalAuth, getOffer);
router.get('/:id/reviews', getOfferReviews); // Public route for offer reviews
router.post('/:id/click', optionalAuth, clickOffer);

// Partner routes - Update offers (requires approved partner)
router.put('/:id', verifyToken, verifyRole('partner'), verifyPartnerApproved, updateOffer);

// Delete offer - Partners can delete their own, admins can delete any
router.delete('/:id', verifyToken, async (req, res, next) => {
  if (req.user.role === 'partner') {
    // For partners, verify they're approved and own the offer
    return verifyPartnerApproved(req, res, next);
  } else if (req.user.role === 'admin') {
    // Admins can delete any offer
    next();
  } else {
    return sendError(res, 403, 'Not authorized to delete offers');
  }
}, deleteOffer);

// Member routes - Redeem offers
router.post('/:id/redeem', verifyToken, verifyRole('member'), redeemOffer);

export default router;

