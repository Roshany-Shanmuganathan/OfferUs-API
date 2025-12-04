import express from 'express';
import { triggerExpiringOffersCheck } from '../utils/expiringOffersScheduler.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Manual trigger endpoint for testing
 * POST /api/scheduler/expiring-offers
 * @access Private (Admin only)
 */
router.post(
  '/expiring-offers',
  verifyToken,
  requireRole('admin'),
  triggerExpiringOffersCheck
);

export default router;

