import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["SuperAdmin", "Moderator", "Support"],
      default: "Moderator",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
