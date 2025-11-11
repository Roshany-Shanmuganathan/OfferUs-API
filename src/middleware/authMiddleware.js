import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/responseFormat.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const verifyToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Not authorized, no token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return sendError(res, 401, 'User not found');
      }

      if (!req.user.isActive) {
        return sendError(res, 401, 'User account is inactive');
      }

      next();
    } catch (error) {
      return sendError(res, 401, 'Not authorized, invalid token');
    }
  } catch (error) {
    return sendError(res, 500, 'Server error during authentication');
  }
};

/**
 * Role-Based Authorization Middleware
 * Accepts single role or array of roles
 * @param {string|string[]} allowedRoles - Single role or array of roles
 * @returns {Function} Express middleware function
 */
export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // Normalize to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!req.user) {
      return sendError(res, 401, 'Not authorized, user not found');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

// Keep protect and authorize for backward compatibility (deprecated)
export const protect = verifyToken;
export const authorize = verifyRole;

/**
 * Verify partner is approved (for offer management)
 * @returns {Function} Express middleware function
 */
export const verifyPartnerApproved = async (req, res, next) => {
  try {
    if (req.user.role !== 'partner') {
      return sendError(res, 403, 'Only partners can access this route');
    }

    const Partner = (await import('../models/Partner.js')).default;
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    if (partner.status !== 'approved') {
      return sendError(res, 403, 'Partner account is not approved yet. Please wait for admin approval.');
    }

    req.partner = partner;
    next();
  } catch (error) {
    return sendError(res, 500, 'Server error during partner verification');
  }
};

// Keep isPartnerOwner for backward compatibility (deprecated)
export const isPartnerOwner = verifyPartnerApproved;

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        // Only set user if account is active
        if (req.user && !req.user.isActive) {
          req.user = null;
        }
      } catch (error) {
        // Invalid token, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

