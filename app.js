import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import customerRoutes from "./routes/customerRoutes.js";
import advertismentRoutes from "./routes/advertismentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
dotenv.config(process.env.MONGO_URI);

connectDB();

app.get("/", (req, res) => {
  res.send("welcom to my offer paltform");
});

app.use("/api/customers", customerRoutes);
app.use("/api/advertisments", advertismentRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/catogories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
