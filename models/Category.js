import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

// categorySchema.index({ categoryName: 1 });

export default mongoose.model("Category", categorySchema);
