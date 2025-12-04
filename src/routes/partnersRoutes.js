import express from 'express';
import {
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerAnalytics,
} from '../controllers/partnerController.js';
import {
  getPartners,
  getPendingPartners,
  approvePartner,
  rejectPartner,
  banPartner,
  unbanPartner,
  deletePartner,
  updatePartnerPremiumStatus,
} from '../controllers/partnerController.js';
import { verifyToken, requireRole, verifyPartnerApproved } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes - Partner management (must come before :id routes)
// GET /api/partners - Get all partners (admin only)
router.get('/', verifyToken, requireRole('admin'), getPartners);

// GET /api/partners/pending - Get pending partners (admin only)
router.get('/pending', verifyToken, requireRole('admin'), getPendingPartners);

// PATCH /api/partners/:id/approve - Approve partner (admin only)
router.patch('/:id/approve', verifyToken, requireRole('admin'), approvePartner);

// PATCH /api/partners/:id/reject - Reject partner (admin only)
router.patch('/:id/reject', verifyToken, requireRole('admin'), rejectPartner);

// PATCH /api/partners/:id/ban - Ban partner (admin only)
router.patch('/:id/ban', verifyToken, requireRole('admin'), banPartner);

// PATCH /api/partners/:id/unban - Unban partner (admin only)
router.patch('/:id/unban', verifyToken, requireRole('admin'), unbanPartner);

// DELETE /api/partners/:id - Delete partner (admin only, cannot delete approved partners)
router.delete('/:id', verifyToken, requireRole('admin'), deletePartner);

// PUT /api/partners/:id/premium - Update premium status (admin only)
router.put('/:id/premium', verifyToken, requireRole('admin'), updatePartnerPremiumStatus);

// Partner profile routes - require authentication and partner role
// GET /api/partners/profile - Get own partner profile (partner only)
router.get('/profile', verifyToken, requireRole('partner'), getPartnerProfile);

// PUT /api/partners/profile - Update own partner profile (partner only)
router.put('/profile', verifyToken, requireRole('partner'), updatePartnerProfile);

// GET /api/partners/analytics - Get partner analytics (partner only)
router.get('/analytics', verifyToken, requireRole('partner'), verifyPartnerApproved, getPartnerAnalytics);

export default router;

