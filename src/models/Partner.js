import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      unique: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    partnerName: {
      type: String,
      required: [true, "Partner name is required"],
      trim: true,
    },
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    location: {
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
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    contactInfo: {
      mobileNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        trim: true,
        match: [
          /^(\+94|0)?[0-9]{9}$/,
          "Please enter a valid Sri Lankan mobile number",
        ],
      },
      website: String,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Partner = mongoose.model("Partner", partnerSchema);

export default Partner;
