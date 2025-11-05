import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

//  Hash password before saving
shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password during login
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Shop", shopSchema);
