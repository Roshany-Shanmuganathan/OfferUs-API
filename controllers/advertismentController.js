import Advertisment from "../models/Advertisment.js";
// Get All Advertisment
const getAllAdvertisments = async (req, res) => {
  try {
    const advertisment = await Advertisment.find();
    res.json({
      success: true,
      count: advertisment.length,
      data: advertisment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get Advertisments",
    });
  }
};

// Get One Advertisment
const getAdvertismentById = async (req, res) => {
  try {
    const advertisment = await Advertisment.findById(req.params.id);

    if (!advertisment) {
      return res.status(404).json({
        success: false,
        error: "advertisment not found",
      });
    }

    res.json({
      success: true,
      data: advertisment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid advertisment ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to receive the advertisment",
    });
  }
};

// Create Advertisment
const createAdvertisment = async (req, res) => {
  try {
    const newAdvertisment = new Advertisment(req.body);
    const savedAdvertisment = await newAdvertisment.save();
    res.status(201).json({
      message: "Advertisment created successfully",
      advertisment: savedAdvertisment,
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
        error: "Advertisment already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update Advertisment
const updateAdvertisment = async (req, res) => {
  try {
    const advertisment = await Advertisment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!advertisment) {
      return res.status(404).json({
        success: false,
        error: "Advertisment not found",
      });
    }

    res.json({
      success: true,
      data: advertisment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid advertisment ID format",
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
      error: "Failed to update advertisment",
    });
  }
};

const deleteAdvertisment = async (req, res) => {
  try {
    const advertisment = await Advertisment.findByIdAndDelete(req.params.id);

    if (!advertisment) {
      return res.status(404).json({
        success: false,
        error: "Advertisment not found",
      });
    }

    res.json({
      success: true,
      message: "Advertisment deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid advertisment ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to delete advertisment",
    });
  }
};

export {
  getAllAdvertisments,
  getAdvertismentById,
  createAdvertisment,
  updateAdvertisment,
  deleteAdvertisment,
};
