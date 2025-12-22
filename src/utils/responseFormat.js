/**
 * Standard response format utility
 */

/**
 * Helper function to set CORS headers on response
 * This ensures CORS headers are present even when errors occur
 */
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;

  // Get allowed origins from environment
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://offer-us.vercel.app",
    "https://offer-us-api.vercel.app",
  ];

  if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
    allowedOrigins.push(...envOrigins);
  }

  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.length > 0) {
    // Fallback to the requested origin if it's safe OR at least the first allowed one
    // Using origin || allowedOrigins[0] is often better for error flows where we want to see the error
    res.setHeader("Access-Control-Allow-Origin", origin || allowedOrigins[0]);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
};

export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null
) => {
  const response = {
    success,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response with optional CORS headers
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array|Object|null} errors - Optional validation errors
 * @param {Object} req - Optional Express request object (for CORS headers)
 */
export const sendError = (
  res,
  statusCode,
  message,
  errors = null,
  req = null
) => {
  // Set CORS headers if request object is provided
  if (req) {
    setCorsHeaders(req, res);
  }

  const response = {
    success: false,
    message,
  };

  // If errors is an array of validation errors, format them properly
  if (errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      // Check if it's an array of error objects with field and message
      if (errors[0] && typeof errors[0] === "object" && errors[0].field) {
        response.errors = errors;
      } else {
        // Legacy format - array of strings
        response.errors = errors;
      }
    } else if (typeof errors === "object") {
      // Single error object
      response.errors = [errors];
    } else {
      // Legacy format - single error message
      response.errors = errors;
    }
  }

  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, statusCode, message, data = null) => {
  return sendResponse(res, statusCode, true, message, data);
};
