import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      unique: true, // One subscription per shop
    },
    planType: {
      type: String,
      enum: ["Free", "Standard", "Premium"],
      default: "Free",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    amount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ shopId: 1, paymentStatus: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
