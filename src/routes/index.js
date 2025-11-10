import express from 'express';
import authRoutes from './authRoutes.js';
import partnerRoutes from './partnerRoutes.js';
import memberRoutes from './memberRoutes.js';
import adminRoutes from './adminRoutes.js';
import publicRoutes from './publicRoutes.js';

const router = express.Router();

// Public routes (no authentication required)
router.use('/', publicRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/partners', partnerRoutes);
router.use('/members', memberRoutes);
router.use('/admin', adminRoutes);

export default router;

