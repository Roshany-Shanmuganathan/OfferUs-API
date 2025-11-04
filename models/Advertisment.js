import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    title: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ["Active", "Ended"], default: "Active" },
  },
  { timestamps: true }
);

advertisementSchema.index({ shopId: 1, status: 1 });

export default mongoose.model("Advertisement", advertisementSchema);
