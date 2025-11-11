import express from 'express';
import {
  saveOffer,
  getSavedOffers,
  removeSavedOffer,
} from '../controllers/savedOfferController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and member role
router.use(verifyToken);
router.use(verifyRole('member'));

// Member routes - Manage saved offers
router.get('/', getSavedOffers);
router.post('/', saveOffer);
router.delete('/:offerId', removeSavedOffer);

export default router;

