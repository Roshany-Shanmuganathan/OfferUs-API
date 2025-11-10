import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/responseFormat.js';

export const protect = async (req, res, next) => {
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

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

export const isPartnerOwner = async (req, res, next) => {
  try {
    if (req.user.role !== 'partner') {
      return sendError(res, 403, 'Only partners can access this route');
    }

    // Verify partner exists and is approved
    const Partner = (await import('../models/Partner.js')).default;
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    if (partner.status !== 'approved') {
      return sendError(res, 403, 'Partner account is not approved yet');
    }

    req.partner = partner;
    next();
  } catch (error) {
    return sendError(res, 500, 'Server error during partner verification');
  }
};

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

