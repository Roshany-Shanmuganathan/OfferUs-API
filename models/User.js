import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },

  role: {
    type: String,
    enum: ["admin", "cashier", "SuperAdmin", "Moderator", "Support"],
    default: "cashier",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
UserSchema.pre("save", async function (next) {
  // Skip hashing if password not modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//  Compare password for login
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
