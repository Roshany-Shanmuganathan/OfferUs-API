import express from "express";
import { createCheckoutSession, verifyPayment, handleWebhook } from "../controllers/paymentController.js";
import { verifyToken, isPartner } from "../middleware/authMiddleware.js";

const router = express.Router();

// Checkout Session Creation
router.post("/create-checkout-session", verifyToken, isPartner, createCheckoutSession);

// Payment Verification (Client-side trigger)
router.post("/verify-payment", verifyToken, isPartner, verifyPayment);

// Webhook (Stripe trigger) - Note: needs raw body, usually handled in server.js
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
