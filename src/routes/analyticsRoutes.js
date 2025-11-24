import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Analytics routes - admin only
// GET /api/analytics - Get platform analytics (admin only)
router.get('/', verifyToken, requireRole('admin'), getAnalytics);

export default router;

