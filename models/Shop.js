import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, match: /^[0-9]{10,15}$/ },
    address: { type: String, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
  },
  { timestamps: true }
);

shopSchema.index({ email: 1, status: 1 });

export default mongoose.model("Shop", shopSchema);
