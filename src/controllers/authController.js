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

// Get cookie options for setting authentication token
// Handles cross-domain scenarios (e.g., frontend on different domain than backend)
// Uses FRONTEND_URL from environment variables for proper cookie domain/security settings
const getCookieOptions = (req) => {
  // Check if backend is running on HTTPS (production/Vercel)
  const isBackendHTTPS = process.env.NODE_ENV === "production" || 
    (req && req.protocol === 'https') ||
    (process.env.VERCEL === '1') ||
    (process.env.VERCEL_URL && process.env.VERCEL_URL.includes('https'));
  
  // Get FRONTEND_URL from environment - supports single URL or comma-separated list
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const frontendUrls = frontendUrl.split(',').map(url => url.trim());
  
  // Determine if we're in a cross-domain scenario
  // Cross-domain means frontend and backend are on different domains/ports
  const isCrossDomain = !frontendUrls.some(url => 
    url === 'http://localhost:3000' || url.includes('localhost')
  );
  
  // Extract domain from FRONTEND_URL for cookie domain setting (if needed)
  // Only set domain for cross-domain scenarios in production
  let domain = undefined;
  if (isCrossDomain && isBackendHTTPS && frontendUrls.length > 0) {
    try {
      const url = new URL(frontendUrls[0]);
      // Only set domain if it's a proper domain (not localhost)
      if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        // Extract root domain (e.g., .example.com from app.example.com)
        const parts = url.hostname.split('.');
        if (parts.length > 1) {
          domain = `.${parts.slice(-2).join('.')}`;
        }
      }
    } catch (e) {
      // Invalid URL, skip domain setting
    }
  }
  
  // For HTTPS backend or cross-domain, we need sameSite: "none" and secure: true
  // Browsers require secure: true when sameSite is "none"
  const needsSecureCookie = isBackendHTTPS || isCrossDomain;
  const needsSameSiteNone = isCrossDomain || isBackendHTTPS;
  
  const cookieOptions = {
    httpOnly: true, // Prevent JavaScript access - REQUIRED for security
    secure: needsSecureCookie, // HTTPS required for cross-domain or when backend is HTTPS
    sameSite: needsSameSiteNone ? "none" : "lax", // "none" for cross-domain/HTTPS, "lax" for same-domain
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (matches JWT_EXPIRE)
    path: "/", // Available site-wide
    ...(domain && { domain }), // Set domain only if needed for cross-domain
  };
  
  // Log cookie settings in development for debugging
  if (process.env.NODE_ENV !== "production") {
    console.log('Cookie Options:', {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      domain: cookieOptions.domain || 'not set',
      isBackendHTTPS,
      isCrossDomain,
      frontendUrl,
      protocol: req?.protocol,
    });
  }
  
  return cookieOptions;
};

// @desc    Register a new member
// @route   POST /api/auth/register/member
// @access  Public
export const registerMember = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      mobileNumber,
      address,
      dateOfBirth,
      gender,
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, "Validation failed", [
        {
          field: !email ? "email" : "password",
          message: !email ? "Email is required" : "Password is required",
        },
      ]);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, "Validation failed", [
        {
          field: "email",
          message: "Please provide a valid email address",
        },
      ]);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail }).session(
      session
    );
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

    // Create user account
    const user = await User.create(
      [
        {
          email: normalizedEmail,
          password,
          role: "member",
        },
      ],
      { session }
    );

    const newUser = user[0];

    // Create member profile
    await Member.create(
      [
        {
          userId: newUser._id,
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

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    const token = generateToken(newUser._id);

    // Set HTTP-only cookie with token
    res.cookie("token", token, getCookieOptions(req));

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Get member data
    const member = await Member.findOne({ userId: newUser._id });

    // Send token in response body for clients that need it (mobile apps, Postman, etc.)
    return sendSuccess(res, 201, "Member registered successfully", {
      token,
      user: userResponse,
      member: member || undefined,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return sendError(res, 400, "Validation failed", validationErrors);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 400, "Validation failed", [
        {
          field: "email",
          message: "User already exists with this email",
        },
      ]);
    }

    return sendError(res, 500, error.message);
  }
};

// @desc    Register a new partner
// @route   POST /api/auth/register/partner
// @access  Public
export const registerPartner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      email,
      password,
      partnerName,
      shopName,
      location,
      category,
      contactInfo,
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, "Validation failed", [
        {
          field: !email ? "email" : "password",
          message: !email ? "Email is required" : "Password is required",
        },
      ]);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, "Validation failed", [
        {
          field: "email",
          message: "Please provide a valid email address",
        },
      ]);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail }).session(
      session
    );
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

    // Create user account
    const user = await User.create(
      [
        {
          email: normalizedEmail,
          password,
          role: "partner",
        },
      ],
      { session }
    );

    const newUser = user[0];

    // Create partner profile with status="pending"
    const partner = await Partner.create(
      [
        {
          userId: newUser._id,
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

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return sendSuccess(
      res,
      201,
      "Partner registration submitted successfully. Waiting for admin approval.",
      {
        partner: {
          id: partner[0]._id,
          email: normalizedEmail,
          partnerName: partner[0].partnerName,
          shopName: partner[0].shopName,
          status: partner[0].status,
        },
      }
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return sendError(res, 400, "Validation failed", validationErrors);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 400, "Validation failed", [
        {
          field: "email",
          message: "User already exists with this email",
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
      return sendError(res, 400, "Please provide email and password");
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check for user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 401, "Invalid credentials");
    }

    if (!user.isActive) {
      return sendError(res, 401, "User account is inactive");
    }

    // For partners, check if they're approved
    if (user.role === "partner") {
      const partner = await Partner.findOne({ userId: user._id });
      if (!partner) {
        return sendError(res, 403, "Partner profile not found");
      }
      if (partner.status !== "approved") {
        return sendError(
          res,
          403,
          "Partner account is pending approval. Please wait for admin approval."
        );
      }
    }

    const token = generateToken(user._id);

    // Set HTTP-only cookie with token
    res.cookie("token", token, getCookieOptions(req));

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Get additional data based on role
    let additionalData = {};
    if (user.role === "partner") {
      const partner = await Partner.findOne({ userId: user._id });
      additionalData.partner = partner || undefined;
    } else if (user.role === "member") {
      const member = await Member.findOne({ userId: user._id });
      additionalData.member = member || undefined;
    }

    // Send token in response body for clients that need it (mobile apps, Postman, etc.)
    return sendSuccess(res, 200, "Login successful", {
      token,
      user: userResponse,
      ...additionalData,
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
      const partner = await Partner.findOne({ userId: user._id });
      additionalData.partner = partner;
    }

    // If member, include member details
    if (user.role === "member") {
      const member = await Member.findOne({ userId: user._id });
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
    // Extract token from cookie or Authorization header
    let token = req.cookies.token;

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      // Decode token without verifying to get exp
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        // Calculate expiry date for blacklist (when token would naturally expire)
        const expiresAt = new Date(decoded.exp * 1000);
        // Store token in blacklist
        await TokenBlacklist.create({ token, expiresAt, reason: "logout" });
      }
    }

    // Clear the HTTP-only cookie (use same options as setting)
    const cookieOptions = getCookieOptions(req);
    res.clearCookie("token", {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
    });

    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    // Handle duplicate entry (already blacklisted)
    if (error.code === 11000) {
      // Still clear the cookie even if token already blacklisted
      const cookieOptions = getCookieOptions(req);
      res.clearCookie("token", {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
      });
      return sendSuccess(res, 200, "Logged out successfully");
    }
    return sendError(res, 500, error.message);
  }
};
