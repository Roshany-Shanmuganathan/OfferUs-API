import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPartners,
  getPendingPartners,
  approvePartner,
  rejectPartner,
  getOffers,
  deleteOffer,
  getAnalytics,
  getMonthlyReport,
  updatePartnerPremiumStatus,
} from '../controllers/adminController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(verifyToken);
router.use(verifyRole('admin'));

// User management routes
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Partner management routes
router.get('/partners', getPartners);
router.get('/partners/pending', getPendingPartners);
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
