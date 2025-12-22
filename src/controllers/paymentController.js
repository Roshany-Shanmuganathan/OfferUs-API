import Stripe from "stripe";
import Partner from "../models/Partner.js";
import { sendSuccess, sendError } from "../utils/responseFormat.js";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

/**
 * @desc    Create Stripe Checkout Session for Subscription
 * @route   POST /api/payment/create-checkout-session
 * @access  Private (Partner)
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planName, price } = req.body;
    const userId = req.user._id;

    // Get partner details
    const partner = await Partner.findOne({ userId });
    if (!partner) {
      return sendError(res, 404, "Partner profile not found");
    }

    // Define line items based on plan
    // In a real app, you'd use Stripe Price IDs, but for demo we can use ad-hoc prices
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `OfferUs ${planName} Plan`,
              description: `Subscription to OfferUs ${planName} features`,
            },
            unit_amount: price * 100, // Stripe expects amount in cents/sub-units
          },
          quantity: 1,
        },
      ],
      mode: "payment", // Use 'subscription' for recurring, but for now 'payment' as per request
      success_url: `${process.env.FRONTEND_URL}/partner/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/partner/subscription/cancel`,
      metadata: {
        partnerId: partner._id.toString(),
        planName: planName.toLowerCase(),
      },
      customer_email: req.user.email,
    });

    return sendSuccess(res, 200, "Checkout session created", {
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Verify payment and update subscription
 * @route   POST /api/payment/verify-payment
 * @access  Private (Partner)
 */
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return sendError(res, 400, "Session ID is required");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const { partnerId, planName } = session.metadata;

      // Update partner subscription status
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month validity

      await Partner.findByIdAndUpdate(partnerId, {
        "subscription.plan": planName,
        "subscription.status": "paid",
        "subscription.startDate": startDate,
        "subscription.endDate": endDate,
      });

      return sendSuccess(res, 200, "Payment verified and subscription updated");
    } else {
      return sendError(res, 400, "Payment not completed");
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Stripe Webhook (Optional but recommended for reliability)
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { partnerId, planName } = session.metadata;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await Partner.findByIdAndUpdate(partnerId, {
      "subscription.plan": planName,
      "subscription.status": "paid",
      "subscription.startDate": startDate,
      "subscription.endDate": endDate,
    });
  }

  res.json({ received: true });
};
