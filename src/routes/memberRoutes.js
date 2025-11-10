import express from 'express';
import {
  redeemOffer,
  saveOffer,
  getSavedOffers,
  removeSavedOffer,
  createReview,
  getNotifications,
  markNotificationAsRead,
} from '../controllers/memberController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and member role
router.use(protect);
router.use(authorize('member', 'admin')); // Allow admin to access member routes too

// Member-only features (require login)
// Save/Unsave offers
router.get('/offers/saved', getSavedOffers);
router.post('/offers/:id/save', saveOffer);
router.delete('/offers/:id/save', removeSavedOffer);

// Redeem offers
router.post('/offers/:id/redeem', redeemOffer);

// Review routes (creating reviews requires login)
router.post('/offers/:id/review', createReview);

// Notification routes (only for logged-in members)
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

export default router;

