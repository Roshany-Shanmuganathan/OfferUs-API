import express from 'express';
import authRoutes from './authRoutes.js';
import memberRoutes from './memberRoutes.js';
import partnerRoutes from './partnerRoutes.js';
import adminRoutes from './adminRoutes.js';
import offerRoutes from './offerRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import savedOfferRoutes from './savedOfferRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = express.Router();

// Public routes
router.use('/offers', offerRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Entity-specific routes
router.use('/members', memberRoutes);
router.use('/partners', partnerRoutes);
router.use('/admin', adminRoutes);
router.use('/reviews', reviewRoutes);
router.use('/saved-offers', savedOfferRoutes);
router.use('/notifications', notificationRoutes);

export default router;
