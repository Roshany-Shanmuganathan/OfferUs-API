import express from 'express';
import {
  getMemberProfile,
  updateMemberProfile,
} from '../controllers/memberController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import { uploadProfileImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Member profile routes - require authentication and member role
// GET /api/members/profile - Get own member profile (member only)
router.get('/profile', verifyToken, requireRole('member'), getMemberProfile);

// PUT /api/members/profile - Update own member profile (member only)
router.put('/profile', verifyToken, requireRole('member'), uploadProfileImage, updateMemberProfile);

export default router;

