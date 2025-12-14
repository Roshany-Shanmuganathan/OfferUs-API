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
    // Start cron scheduler after database connection is established
    startCronScheduler();
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });

// Initialize Express app
const app = express();

// Trust proxy (required for Vercel and other platforms that use reverse proxies)
// This ensures req.protocol returns 'https' when behind a proxy
app.set("trust proxy", 1);

// CORS configuration - allow credentials for cookies
// Support multiple origins for development and production
// FRONTEND_URL can be a single URL or comma-separated list

// Helper function to normalize origin (remove trailing slash)
const normalizeOrigin = (origin) => {
  if (!origin) return null;
  return origin.replace(/\/$/, ""); // Remove trailing slash
};

// Build allowed origins array
const allowedOrigins = ["http://localhost:3000", "https://offer-us.vercel.app"];

// Add FRONTEND_URL if provided (supports comma-separated values)
if (process.env.FRONTEND_URL) {
  const frontendUrls = process.env.FRONTEND_URL.split(",").map((url) =>
    url.trim()
  );
  allowedOrigins.push(...frontendUrls);
}

// Normalize all allowed origins
const normalizedAllowedOrigins = allowedOrigins
  .filter(Boolean)
  .map(normalizeOrigin);

// Log allowed origins in development (for debugging)
if (process.env.NODE_ENV !== "production") {
  console.log("Allowed CORS origins:", normalizedAllowedOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) only in development
      if (!origin) {
        if (process.env.NODE_ENV === "production") {
          return callback(new Error("Not allowed by CORS"));
        }
        return callback(null, true);
      }

      // Normalize the incoming origin
      const normalizedOrigin = normalizeOrigin(origin);

      // Check if origin is in allowed list
      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        // Log the rejected origin for debugging
        console.warn(
          `CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`
        );
        console.warn(`Allowed origins: ${normalizedAllowedOrigins.join(", ")}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
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
