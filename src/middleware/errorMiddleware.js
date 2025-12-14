import { sendError } from "../utils/responseFormat.js";

/**
 * Helper function to set CORS headers on response
 * This ensures CORS headers are always present on error responses
 */
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;

  // Get allowed origins from environment
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : ["http://localhost:3000"];

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (
    process.env.NODE_ENV !== "production" &&
    origin &&
    origin.includes("localhost")
  ) {
    // Allow localhost in development
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.length > 0) {
    // Fallback to first allowed origin
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
};

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    url: req.originalUrl,
    method: req.method,
    origin: req.headers.origin,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = {
      message,
      statusCode: 400,
      errors: [
        {
          field: field,
          message: `${field} already exists`,
        },
      ],
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = {
      message: "Validation failed",
      statusCode: 400,
      errors: validationErrors,
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File too large. Maximum size is 5MB";
    error = { message, statusCode: 400 };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Unexpected file field";
    error = { message, statusCode: 400 };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Server Error";
  const errors = error.errors || null;

  // Set CORS headers before sending error response
  setCorsHeaders(req, res);

  return sendError(res, statusCode, message, errors, req);
};

export const notFound = (req, res, next) => {
  // Set CORS headers for 404 responses
  setCorsHeaders(req, res);

  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
