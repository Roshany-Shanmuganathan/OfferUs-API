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
  getOffers,
} from '../controllers/offerController.js';
import { getOfferReviews } from '../controllers/reviewController.js';
import { verifyToken, verifyPartnerApproved, authOptional, requireRole } from '../middleware/authMiddleware.js';
import { sendError } from '../utils/responseFormat.js';

const router = express.Router();

// Public routes - Specific routes must come before parameterized routes
// GET /api/offers/categories - Get offer categories (public)
router.get('/categories', getCategories);

// GET /api/offers - Browse all offers (public, optional auth)
router.get('/', authOptional, browseOffers);

// Admin routes - must come before /:id routes
// GET /api/offers/admin/all - Get all offers with admin filters (admin only)
router.get('/admin/all', verifyToken, requireRole('admin'), getOffers);

// Partner-specific routes (must come before /:id routes)
// POST /api/offers - Create offer (partner only, approved)
router.post('/', verifyToken, requireRole('partner'), verifyPartnerApproved, createOffer);

// GET /api/offers/partner/my-offers - Get partner's own offers (partner only, approved)
router.get('/partner/my-offers', verifyToken, requireRole('partner'), verifyPartnerApproved, getPartnerOffers);

// GET /api/offers/partner/:id - Get partner's specific offer (partner only, approved)
router.get('/partner/:id', verifyToken, requireRole('partner'), verifyPartnerApproved, getPartnerOffer);

// Public routes with parameters
// GET /api/offers/:id - Get single offer (public, optional auth)
router.get('/:id', authOptional, getOffer);

// GET /api/offers/:id/reviews - Get offer reviews (public)
router.get('/:id/reviews', getOfferReviews);

// POST /api/offers/:id/click - Click offer (public, optional auth)
router.post('/:id/click', authOptional, clickOffer);

// Partner routes - Update offers (requires approved partner)
// PUT /api/offers/:id - Update offer (partner only, approved)
router.put('/:id', verifyToken, requireRole('partner'), verifyPartnerApproved, updateOffer);

// Delete offer - Partners can delete their own, admins can delete any
// DELETE /api/offers/:id - Delete offer (partner/admin)
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
// POST /api/offers/:id/redeem - Redeem offer (member only)
router.post('/:id/redeem', verifyToken, requireRole('member'), redeemOffer);

export default router;
