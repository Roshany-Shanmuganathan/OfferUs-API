import mongoose from 'mongoose';
import crypto from 'crypto';

const couponSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
            unique: true,
            uppercase: true,
            trim: true,
        },
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Member reference is required'],
        },
        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Partner',
            required: [true, 'Partner reference is required'],
        },
        offer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Offer',
            required: [true, 'Offer reference is required'],
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'REDEEMED', 'EXPIRED'],
            default: 'ACTIVE',
        },
        qrToken: {
            type: String,
            unique: true,
        },
        couponColor: {
            type: String,
            default: '#c9a962',
            trim: true,
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        redeemedAt: {
            type: Date,
        },
        redeemedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Generate unique coupon code before saving
couponSchema.pre('save', function (next) {
    if (!this.couponCode) {
        // Generate format: COUP-XXXX-XXXX
        const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
        this.couponCode = `COUP-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
    }

    if (!this.qrToken) {
        // Generate secure token for QR code
        this.qrToken = crypto.randomBytes(32).toString('hex');
    }

    next();
});

// Index for efficient searching
couponSchema.index({ member: 1, status: 1 });
couponSchema.index({ partner: 1, status: 1 });
couponSchema.index({ offer: 1 });
couponSchema.index({ qrToken: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ couponCode: 1 });

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function () {
    return this.expiryDate < new Date();
});

// Method to check if coupon is valid for redemption
couponSchema.methods.isValidForRedemption = function () {
    if (this.status === 'REDEEMED') {
        return { valid: false, reason: 'Coupon has already been redeemed' };
    }

    if (this.status === 'EXPIRED' || this.expiryDate < new Date()) {
        return { valid: false, reason: 'Coupon has expired' };
    }

    return { valid: true };
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
