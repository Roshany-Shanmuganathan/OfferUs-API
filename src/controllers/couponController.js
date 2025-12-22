import Coupon from '../models/Coupon.js';
import Offer from '../models/Offer.js';
import Partner from '../models/Partner.js';
import Member from '../models/Member.js';
import { generateQRCode, isValidToken } from '../utils/qrCode.js';

/**
 * Generate a new coupon for an offer
 * POST /api/coupons/generate
 * @access Member only
 */
export const generateCoupon = async (req, res) => {
    try {
        const { offerId } = req.body;
        const userId = req.user.id;

        // Validate offer exists and is active
        const offer = await Offer.findById(offerId).populate('partner');
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found',
            });
        }

        if (!offer.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This offer is no longer active',
            });
        }

        // Check if offer is expired
        if (new Date(offer.expiryDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This offer has expired',
            });
        }

        // Get member details
        const member = await Member.findOne({ userId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member profile not found',
            });
        }

        // Calculate coupon expiry date
        let couponExpiryDate;
        if (offer.couponExpiryDays !== null && offer.couponExpiryDays !== undefined) {
            // Use custom expiry days from offer
            couponExpiryDate = new Date();
            couponExpiryDate.setDate(couponExpiryDate.getDate() + offer.couponExpiryDays);
        } else {
            // Default: coupon expires with offer
            couponExpiryDate = offer.expiryDate;
        }

        // Create new coupon
        const coupon = new Coupon({
            member: userId,
            partner: offer.partner._id,
            offer: offerId,
            expiryDate: couponExpiryDate,
            couponColor: offer.couponColor || '#c9a962', // Use offer's color or default
        });

        await coupon.save();

        // Generate QR code with Member ID
        // Format: JSON string with token (t) and memberId (m)
        const qrData = JSON.stringify({
            t: coupon.qrToken,
            m: userId
        });
        const qrCodeDataUrl = await generateQRCode(qrData);

        // Populate coupon details
        await coupon.populate([
            { path: 'offer', select: 'title description discount imageUrl' },
            { path: 'partner', select: 'shopName partnerName location' },
            { path: 'member', select: 'email' },
        ]);

        res.status(201).json({
            success: true,
            message: 'Coupon generated successfully',
            data: {
                coupon: {
                    ...coupon.toObject(),
                    qrCodeDataUrl,
                },
            },
        });
    } catch (error) {
        console.error('Generate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate coupon',
            error: error.message,
        });
    }
};

/**
 * Get all coupons for the logged-in member
 * GET /api/coupons/my-coupons
 * @access Member only
 */
export const getMyCoupons = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        // Build query
        const query = { member: userId };
        if (status) {
            query.status = status.toUpperCase();
        }

        // Update expired coupons
        await Coupon.updateMany(
            {
                member: userId,
                status: 'ACTIVE',
                expiryDate: { $lt: new Date() },
            },
            { status: 'EXPIRED' }
        );

        const coupons = await Coupon.find(query)
            .populate('offer', 'title description discount imageUrl')
            .populate('partner', 'shopName partnerName location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                coupons,
                count: coupons.length,
            },
        });
    } catch (error) {
        console.error('Get my coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message,
        });
    }
};

/**
 * Get member coupon statistics
 * GET /api/coupons/member/stats
 * @access Member only
 */
export const getMemberCouponStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalGenerated = await Coupon.countDocuments({ member: userId });
        const totalRedeemed = await Coupon.countDocuments({ 
            member: userId, 
            status: 'REDEEMED' 
        });
        const activeCoupons = await Coupon.countDocuments({ 
            member: userId, 
            status: 'ACTIVE',
            expiryDate: { $gt: new Date() }
        });

        res.status(200).json({
            success: true,
            data: {
                totalGenerated,
                totalRedeemed,
                activeCoupons
            }
        });
    } catch (error) {
        console.error('Get member stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupon statistics',
            error: error.message,
        });
    }
};

/**
 * Get specific coupon details
 * GET /api/coupons/:id
 * @access Member (own coupons) or Partner (for validation)
 */
export const getCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const coupon = await Coupon.findById(id)
            .populate('offer', 'title description discount imageUrl originalPrice discountedPrice')
            .populate('partner', 'shopName partnerName location contactInfo')
            .populate('member', 'email');

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        // Check authorization (member owns it or partner can view for validation)
        const partner = await Partner.findOne({ userId });
        const isMemberOwner = coupon.member._id.toString() === userId;
        const isPartnerAuthorized = partner && coupon.partner._id.toString() === partner._id.toString();

        if (!isMemberOwner && !isPartnerAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this coupon',
            });
        }

        // Generate QR code if member is viewing
        let qrCodeDataUrl;
        if (isMemberOwner) {
            // Format: JSON string with token (t) and memberId (m)
            const qrData = JSON.stringify({
                t: coupon.qrToken,
                m: coupon.member._id
            });
            qrCodeDataUrl = await generateQRCode(qrData);
        }

        res.status(200).json({
            success: true,
            data: {
                coupon: {
                    ...coupon.toObject(),
                    qrCodeDataUrl,
                },
            },
        });
    } catch (error) {
        console.error('Get coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupon',
            error: error.message,
        });
    }
};

/**
 * Validate a coupon by QR token
 * POST /api/coupons/validate
 * @access Partner only
 */
export const validateCoupon = async (req, res) => {
    try {
        let { qrToken } = req.body;
        const userId = req.user.id;

        // Handle JSON format if present (from new QR codes)
        try {
            if (qrToken.startsWith('{')) {
                const parsed = JSON.parse(qrToken);
                if (parsed.t) {
                    qrToken = parsed.t;
                    // We could also validate parsed.m (memberId) here if needed
                }
            }
        } catch (e) {
            // Not JSON, assume raw token (backward compatibility)
        }

        // Validate token format
        if (!isValidToken(qrToken)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR token format',
            });
        }

        // Get partner details
        const partner = await Partner.findOne({ userId });
        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Partner profile not found',
            });
        }

        // Find coupon by QR token
        const coupon = await Coupon.findOne({ qrToken })
            .populate('offer', 'title description discount imageUrl originalPrice discountedPrice')
            .populate('partner', 'shopName partnerName')
            .populate('member', 'email');

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
                valid: false,
            });
        }

        // Check if coupon belongs to this partner
        if (coupon.partner._id.toString() !== partner._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This coupon is not valid at your shop',
                valid: false,
            });
        }

        // Update status if expired
        if (coupon.status === 'ACTIVE' && new Date(coupon.expiryDate) < new Date()) {
            coupon.status = 'EXPIRED';
            await coupon.save();
        }

        // Check if valid for redemption
        const validationResult = coupon.isValidForRedemption();

        res.status(200).json({
            success: true,
            valid: validationResult.valid,
            message: validationResult.valid ? 'Coupon is valid' : validationResult.reason,
            data: {
                coupon: validationResult.valid ? coupon : null,
            },
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
            error: error.message,
        });
    }
};

/**
 * Redeem a validated coupon
 * POST /api/coupons/redeem
 * @access Partner only
 */
export const redeemCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;
        const userId = req.user.id;

        // Get partner details
        const partner = await Partner.findOne({ userId });
        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Partner profile not found',
            });
        }

        // Find coupon
        const coupon = await Coupon.findById(couponId)
            .populate('offer')
            .populate('partner', 'shopName')
            .populate('member', 'email');

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        // Verify partner ownership
        if (coupon.partner._id.toString() !== partner._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This coupon is not valid at your shop',
                });
        }

        // Check if valid for redemption
        const validationResult = coupon.isValidForRedemption();
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                message: validationResult.reason,
            });
        }

        // Redeem the coupon
        coupon.status = 'REDEEMED';
        coupon.redeemedAt = new Date();
        coupon.redeemedBy = userId;
        await coupon.save();

        // Update offer analytics
        if (coupon.offer) {
            await Offer.findByIdAndUpdate(coupon.offer._id, {
                $inc: { 'analytics.redemptions': 1 },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Coupon redeemed successfully',
            data: {
                coupon,
            },
        });
    } catch (error) {
        console.error('Redeem coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to redeem coupon',
            error: error.message,
        });
    }
};

/**
 * Get all redeemed coupons for partner
 * GET /api/coupons/partner/redeemed
 * @access Partner only
 */
export const getPartnerRedemptions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get partner details
        const partner = await Partner.findOne({ userId });
        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Partner profile not found',
            });
        }

        const coupons = await Coupon.find({
            partner: partner._id,
            status: 'REDEEMED',
        })
            .populate('offer', 'title discount')
            .populate('member', 'email')
            .sort({ redeemedAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                coupons,
                count: coupons.length,
            },
        });
    } catch (error) {
        console.error('Get partner redemptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch redemptions',
            error: error.message,
        });
    }
};
