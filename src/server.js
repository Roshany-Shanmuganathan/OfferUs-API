import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import { startCronScheduler } from "./utils/cronScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to database
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    // Only start cron scheduler in development; Vercel should use Vercel Cron
    if (process.env.NODE_ENV !== "production") {
      startCronScheduler();
    }
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    // Don't exit process in production/vercel
  });

// Initialize Express app
const app = express();
// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://offer-us.vercel.app",
  "https://offer-us-api.vercel.app",
];

// Add FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        // In production, we might want to be more strict, 
        // but for debugging let's allow it or at least not throw an error that stops headers
        console.warn(`Origin ${origin} not explicitly allowed but continuing for debugging`);
        callback(null, true); 
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// Middleware
app.use(cookieParser()); // Parse cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", routes);

// Root route for health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OfferUs API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "https://github.com/your-repo/api-docs",
    },
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Export app for Vercel serverless
export default app;

// Start server only in non-production (for local development)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Server running in ${
        process.env.NODE_ENV || "development"
      } mode on port ${PORT}`
    );
  });
}
