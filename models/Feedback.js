import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    feedbackDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

feedbackSchema.index({ shopId: 1, customerId: 1 });

export default mongoose.model("Feedback", feedbackSchema);
