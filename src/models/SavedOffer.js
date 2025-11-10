import mongoose from 'mongoose';

const savedOfferSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: [true, 'Offer reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one saved offer per member per offer
savedOfferSchema.index({ member: 1, offer: 1 }, { unique: true });

const SavedOffer = mongoose.model('SavedOffer', savedOfferSchema);

export default SavedOffer;

