import express from 'express';
import {
  registerMember,
  registerPartner,
  login,
  getMe,
  logout,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register/member', registerMember);
router.post('/register/partner', registerPartner);
router.post('/login', login);

// Protected routes
router.get('/me', verifyToken, getMe);
router.post('/logout', verifyToken, logout);

export default router;
