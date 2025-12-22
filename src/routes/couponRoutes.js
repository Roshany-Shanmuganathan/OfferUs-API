import express from 'express';
import {
    generateCoupon,
    getMyCoupons,
    getCoupon,
    validateCoupon,
    redeemCoupon,
    getPartnerRedemptions,
    getMemberCouponStats,
} from '../controllers/couponController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Member routes - Generate and view coupons
router.post('/generate', requireRole('member'), generateCoupon);
router.get('/my-coupons', requireRole('member'), getMyCoupons);
router.get('/member/stats', requireRole('member'), getMemberCouponStats);

// Partner routes - Validate and redeem coupons
router.post('/validate', requireRole('partner'), validateCoupon);
router.post('/redeem', requireRole('partner'), redeemCoupon);
router.get('/partner/redeemed', requireRole('partner'), getPartnerRedemptions);

// Shared route - Get specific coupon (member or partner)
router.get('/:id', getCoupon);

export default router;
