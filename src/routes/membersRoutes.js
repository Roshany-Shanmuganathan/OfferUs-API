import express from 'express';
import {
  getMemberProfile,
  updateMemberProfile,
} from '../controllers/memberController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import { createCloudinaryUpload } from '../services/cloudinaryService.js';

const router = express.Router();

// Member profile routes - require authentication and member role
// GET /api/members/profile - Get own member profile (member only)
router.get('/profile', verifyToken, requireRole('member'), getMemberProfile);

// PUT /api/members/profile - Update own member profile (member only)
// Supports both file upload and direct URL update
router.put(
  '/profile',
  verifyToken,
  requireRole('member'),
  (req, res, next) => {
    // Only use multer if Content-Type is multipart/form-data
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const upload = createCloudinaryUpload('member-profiles', 'profilePicture');
      upload(req, res, next);
    } else {
      next();
    }
  },
  updateMemberProfile
);

export default router;

