import mongoose from "mongoose";

// Sri Lankan address pattern
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [
        /^(\+94|0)?[0-9]{9}$/,
        "Please enter a valid Sri Lankan mobile number",
      ],
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      district: {
        type: String,
        required: [true, "District is required"],
        trim: true,
        enum: [
          "Colombo",
          "Gampaha",
          "Kalutara",
          "Kandy",
          "Matale",
          "Nuwara Eliya",
          "Galle",
          "Matara",
          "Hambantota",
          "Jaffna",
          "Kilinochchi",
          "Mannar",
          "Vavuniya",
          "Mullaitivu",
          "Batticaloa",
          "Ampara",
          "Trincomalee",
          "Kurunegala",
          "Puttalam",
          "Anuradhapura",
          "Polonnaruwa",
          "Badulla",
          "Moneragala",
          "Ratnapura",
          "Kegalle",
        ],
      },
      postalCode: {
        type: String,
        required: [true, "Postal code is required"],
        trim: true,
        match: [/^[0-9]{5}$/, "Postal code must be 5 digits"],
      },
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;
