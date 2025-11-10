import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPartners,
  approvePartner,
  rejectPartner,
  getOffers,
  deleteOffer,
  getAnalytics,
  getMonthlyReport,
  updatePartnerPremiumStatus,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// Partner management routes
router.get('/partners', getPartners);
router.put('/partners/:id/approve', approvePartner);
router.put('/partners/:id/reject', rejectPartner);
router.put('/partners/:id/premium', updatePartnerPremiumStatus);

// Offer management routes
router.get('/offers', getOffers);
router.delete('/offers/:id', deleteOffer);

// Analytics and reports routes
router.get('/analytics', getAnalytics);
router.get('/reports/monthly', getMonthlyReport);

export default router;

