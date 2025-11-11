import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Partner from "../models/Partner.js";
import Member from "../models/Member.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { sendSuccess, sendError } from "../utils/responseFormat.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @desc    Register a new user (Member or Partner)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, role } = req.body;

    // Validate role - Admin role cannot be registered through API for security
    if (!["member", "partner"].includes(role)) {
      await session.abortTransaction();
      session.endSession();
      return sendError(
        res,
        400,
        'Invalid role. Must be either "member" or "partner". Admin accounts cannot be registered through this endpoint.'
      );
    }

    // Explicitly prevent admin registration
    if (role === "admin") {
      await session.abortTransaction();
      session.endSession();
      return sendError(
        res,
        403,
        "Admin accounts cannot be registered through this endpoint. Please contact system administrator."
      );
    }

    // Check if user already exists (business logic check - not schema validation)
    const userExists = await User.findOne({ email }).session(session);
    if (userExists) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, "Validation failed", [
        {
          field: "email",
          message: "User already exists with this email",
        },
      ]);
    }

    // All validations passed - create user
    const user = await User.create(
      [
        {
          email,
          password,
          role,
          profile: {},
        },
      ],
      { session }
    );

    const newUser = user[0];

    // Create role-specific profile
    if (role === "partner") {
      const { partnerName, shopName, location, category, contactInfo } = req.body;

      await Partner.create(
        [
          {
            user: newUser._id,
            partnerName,
            shopName,
            location,
            category,
            contactInfo: {
              mobileNumber: contactInfo.mobileNumber,
              website: contactInfo.website || undefined,
            },
            status: "pending",
          },
        ],
        { session }
      );
    } else if (role === "member") {
      const { firstName, lastName, mobileNumber, address, dateOfBirth, gender } = req.body;

      await Member.create(
        [
          {
            user: newUser._id,
            firstName,
            lastName,
            mobileNumber,
            address,
            dateOfBirth: dateOfBirth || undefined,
            gender: gender || undefined,
          },
        ],
        { session }
      );
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    const token = generateToken(newUser._id);

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return sendSuccess(res, 201, "User registered successfully", {
      user: userResponse,
      token,
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();

    // Handle Mongoose validation errors - will be caught by error middleware
    // But we format it here for consistency in transaction context
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return sendError(res, 400, "Validation failed", validationErrors);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendError(res, 400, "Validation failed", [
        {
          field: field,
          message: `${field} already exists`,
        },
      ]);
    }

    return sendError(res, 500, error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    // Check for user
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 401, 'Invalid credentials');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'User account is inactive');
    }

    // For partners, check if they're approved
    if (user.role === 'partner') {
      const partner = await Partner.findOne({ user: user._id });
      if (partner && partner.status !== 'approved') {
        return sendError(res, 403, 'Partner account is pending approval');
      }
    }

    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return sendSuccess(res, 200, 'Login successful', {
      user: userResponse,
      token,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    let additionalData = {};

    // If partner, include partner details
    if (user.role === "partner") {
      const partner = await Partner.findOne({ user: user._id });
      additionalData.partner = partner;
    }

    // If member, include member details
    if (user.role === "member") {
      const member = await Member.findOne({ user: user._id });
      additionalData.member = member;
    }

    return sendSuccess(res, 200, "User retrieved successfully", {
      user,
      ...additionalData,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Logout user (invalidate token)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Extract token from Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 400, 'Token not provided');
    }

    // Decode token without verifying to get exp (we already verified in middleware)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return sendError(res, 400, 'Invalid token');
    }

    // Calculate expiry date for blacklist (when token would naturally expire)
    const expiresAt = new Date(decoded.exp * 1000);

    // Store token in blacklist
    await TokenBlacklist.create({ token, expiresAt, reason: 'logout' });

    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    // Handle duplicate entry (already blacklisted)
    if (error.code === 11000) {
      return sendSuccess(res, 200, 'Logged out successfully');
    }
    return sendError(res, 500, error.message);
  }
};

