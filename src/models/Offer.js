import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'Partner reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Offer description is required'],
    },
    discount: {
      type: Number,
      required: [true, 'Discount is required'],
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountedPrice: {
      type: Number,
      required: [true, 'Discounted price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      redemptions: {
        type: Number,
        default: 0,
      },
    },
    imageUrl: String,
    termsAndConditions: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient searching
offerSchema.index({ partner: 1, isActive: 1 });
offerSchema.index({ category: 1, isActive: 1 });
offerSchema.index({ expiryDate: 1 });
offerSchema.index({ 'partner.location.city': 1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;

