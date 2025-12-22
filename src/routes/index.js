import express from 'express';
import authRoutes from './authRoutes.js';
import usersRoutes from './usersRoutes.js';
import membersRoutes from './membersRoutes.js';
import partnersRoutes from './partnersRoutes.js';
import offerRoutes from './offerRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import savedOfferRoutes from './savedOfferRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import monthlyReportsRoutes from './monthlyReportsRoutes.js';
import schedulerRoutes from './schedulerRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import couponRoutes from './couponRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = express.Router();

// Authentication routes (public)
router.use('/auth', authRoutes);

// Payment routes
router.use('/payment', paymentRoutes);

// Upload routes (authenticated)
router.use('/upload', uploadRoutes);

// Entity-based routes (RBAC applied per route)
router.use('/users', usersRoutes);
router.use('/members', membersRoutes);
router.use('/partners', partnersRoutes);
router.use('/offers', offerRoutes);
router.use('/reviews', reviewRoutes);
router.use('/saved-offers', savedOfferRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin/analytics', analyticsRoutes); // Admin analytics endpoint
router.use('/monthly-reports', monthlyReportsRoutes);
router.use('/scheduler', schedulerRoutes);

export default router;
