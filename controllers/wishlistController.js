import Wishlist from "../models/Wishlist.js";
// Get All Wishlist
const getAllWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find();
    res.json({
      success: true,
      count: wishlists.length,
      data: wishlists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get Wishlists",
    });
  }
};

// Get One Wishlist
const getWishlistById = async (req, res) => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: "wishlist not found",
      });
    }

    res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid wishlist ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to receive the wishlist",
    });
  }
};

// Create Wishlist
const createWishlist = async (req, res) => {
  try {
    const newWishlist = new Wishlist(req.body);
    const savedWishlist = await newWishlist.save();
    res.status(201).json({
      message: "Wishlist created successfully",
      wishlist: savedWishlist,
    });
  } catch (error) {
    if (error.name === "validationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Wishlist already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update Wishlist
const updateWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: "Wishlist not found",
      });
    }

    res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid wishlist ID format",
      });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update wishlist",
    });
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findByIdAndDelete(req.params.id);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: "Wishlist not found",
      });
    }

    res.json({
      success: true,
      message: "Wishlist deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid wishlist ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to delete wishlist",
    });
  }
};

export {
  getAllWishlists,
  getWishlistById,
  createWishlist,
  updateWishlist,
  deleteWishlist,
};
