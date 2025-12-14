/**
 * Standard response format utility
 */
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

export const sendError = (res, statusCode, message, errors = null) => {
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
