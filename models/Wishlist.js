import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    wishlist_id: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    offers: [
      {
        offer_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Offer",
          required: true,
        },
        added_date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    notes: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    is_public: {
      type: Boolean,
      default: false, // customers can choose to make it shareable
    },

    total_items: {
      type: Number,
      default: 0,
      min: 0,
    },

    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 🔁 Middleware to auto-update total_items and last_updated
wishlistSchema.pre("save", function (next) {
  this.total_items = this.offers.length;
  this.last_updated = new Date();
  next();
});

// 🧠 Virtual: Compute all active offers in wishlist
wishlistSchema.virtual("activeOffers", {
  ref: "Offer",
  localField: "offers.offer_id",
  foreignField: "_id",
  match: { status: "active" },
});

export default mongoose.model("Wishlist", wishlistSchema);
