import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
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

// Index for efficient searching
categorySchema.index({ name: 1 });

// Check if model already exists to avoid overwriting
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;

