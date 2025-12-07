import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: No need to manually index 'name' field as 'unique: true' already creates an index

// Check if model already exists to avoid overwriting
const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
