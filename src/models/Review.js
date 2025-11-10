import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
    },
    partnerResponse: {
      type: String,
      trim: true,
    },
    responseDate: Date,
  },
  {
    timestamps: true,
  }
);

// Ensure one review per member per offer
reviewSchema.index({ member: 1, offer: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

