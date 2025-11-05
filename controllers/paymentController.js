import Payment from "../models/Payment.js";
// Get All Payment
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("shopId", "shopName email")
      .populate("subscriptionId", "planType amount paymentStatus")
      .populate("advertisementId", "title cost duration");
    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get Payments",
    });
  }
};

// Get One Payment
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "payment not found",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid payment ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to receive the payment",
    });
  }
};

// Create Payment
const createPayment = async (req, res) => {
  try {
    const newPayment = new Payment(req.body);
    const savedPayment = await newPayment.save();
    res.status(201).json({
      message: "Payment created successfully",
      payment: savedPayment,
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
        error: "Payment already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update Payment
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid payment ID format",
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
      error: "Failed to update payment",
    });
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid payment ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to delete payment",
    });
  }
};

export {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
