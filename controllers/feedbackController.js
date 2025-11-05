import Feedback from "../models/Feedback.js";
// Get All Feedback
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("customerId", "name email phone")
      .populate("shopId", "shopName email categoryId");
    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get Feedback",
    });
  }
};

// Get One Feedback
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "feedback not found",
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid feedback ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to receive the feedback",
    });
  }
};

// Create Feedback
const createFeedback = async (req, res) => {
  try {
    const newFeedback = new Feedback(req.body);
    const savedFeedback = await newFeedback.save();
    res.status(201).json({
      message: "Feedback created successfully",
      feedback: savedFeedback,
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
        error: "Feedback already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update Feedback
const updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid feedback ID format",
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
      error: "Failed to update feedback",
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid feedback ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to delete feedback",
    });
  }
};

export {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
