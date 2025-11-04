import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    discountPercentage: {
      type: Number,
      min: 1,
      max: 90,
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    offerType: {
      type: String,
      enum: ["Seasonal", "Festival", "Clearance", "Limited"],
      default: "Limited",
    },
    status: { type: String, enum: ["Active", "Expired"], default: "Active" },
  },
  { timestamps: true }
);

offerSchema.index({ shopId: 1, status: 1 });

export default mongoose.model("Offer", offerSchema);
