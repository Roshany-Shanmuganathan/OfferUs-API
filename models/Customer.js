import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      match: /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10,15}$/,
    },
    password: { type: String, required: true, minlength: 6 },
    location: { type: String },
    registeredDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
