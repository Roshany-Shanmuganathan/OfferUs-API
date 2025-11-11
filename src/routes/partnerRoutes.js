import express from 'express';
import {
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerAnalytics,
} from '../controllers/partnerController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and partner role
router.use(verifyToken);
router.use(verifyRole('partner'));

// Partner profile routes
router.get('/profile', getPartnerProfile);
router.put('/profile', updatePartnerProfile);
router.get('/analytics', getPartnerAnalytics);

export default router;
