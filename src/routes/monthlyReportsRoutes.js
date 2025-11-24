import express from 'express';
import { getMonthlyReport } from '../controllers/monthlyReportsController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Monthly reports routes - admin only
// GET /api/monthly-reports - Generate monthly report (admin only)
router.get('/', verifyToken, requireRole('admin'), getMonthlyReport);

export default router;

