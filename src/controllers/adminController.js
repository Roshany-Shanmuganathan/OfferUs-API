import mongoose from 'mongoose';
import User from '../models/User.js';
import Partner from '../models/Partner.js';
import Member from '../models/Member.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import SavedOffer from '../models/SavedOffer.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return sendSuccess(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get a single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    let additionalData = {};

    if (user.role === 'partner') {
      const partner = await Partner.findOne({ user: user._id });
      additionalData.partner = partner;
    }

    if (user.role === 'member') {
      const member = await Member.findOne({ user: user._id });
      additionalData.member = member;
    }

    return sendSuccess(res, 200, 'User retrieved successfully', {
      user,
      ...additionalData,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const { isActive, role, profile } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return sendSuccess(res, 200, 'User updated successfully', { user: userResponse });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // If partner, delete partner profile and offers
    if (user.role === 'partner') {
      const partner = await Partner.findOne({ user: user._id });
      if (partner) {
        await Offer.deleteMany({ partner: partner._id });
        await Partner.findByIdAndDelete(partner._id);
      }
    }

    // If member, delete member profile
    if (user.role === 'member') {
      await Member.findOneAndDelete({ user: user._id });
    }

    // Delete user's reviews and saved offers
    await Review.deleteMany({ member: user._id });
    await SavedOffer.deleteMany({ member: user._id });

    await User.findByIdAndDelete(user._id);

    return sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get all partners (pending, approved, rejected)
// @route   GET /api/admin/partners
// @access  Private (Admin)
export const getPartners = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const partners = await Partner.find(query)
      .populate('user', 'email profile isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Partner.countDocuments(query);

    return sendSuccess(res, 200, 'Partners retrieved successfully', {
      partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get all pending partners waiting for approval
// @route   GET /api/admin/partners/pending
// @access  Private (Admin)
export const getPendingPartners = async (req, res) => {
  try {
    // Get pagination parameters from query string (optional)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find all partners with status "pending"
    const partners = await Partner.find({ status: 'pending' })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    // Count total pending partners
    const total = await Partner.countDocuments({ status: 'pending' });

    return sendSuccess(res, 200, 'Pending partners retrieved successfully', {
      partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Approve partner registration and create login credentials
// @route   PUT /api/admin/partners/:id/approve
// @access  Private (Admin)
export const approvePartner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get partner ID from URL parameter
    const partnerId = req.params.id;
    
    // Get password and optional email from request body
    // User model validation will handle missing/invalid password
    const { password, email } = req.body || {};

    // Find the partner by ID
    const partner = await Partner.findById(partnerId).session(session);

    if (!partner) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Partner not found');
    }

    // Check if partner is already approved
    if (partner.status === 'approved') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, 'Validation failed', [
        {
          field: 'status',
          message: 'Partner is already approved',
        },
      ]);
    }

    // Use email from request body, or use partner's email if not provided
    const userEmail = email || partner.email;

    // Check if user already exists with this email
    const userExists = await User.findOne({ email: userEmail }).session(session);
    if (userExists) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, 'Validation failed', [
        {
          field: 'email',
          message: 'User already exists with this email',
        },
      ]);
    }

    // Create user account with password
    // User schema will validate password (minimum 6 characters)
    const user = await User.create(
      [
        {
          email: userEmail,
          password,
          role: 'partner',
          profile: {},
        },
      ],
      { session }
    );

    const newUser = user[0];

    // Update partner: link to user and set status to approved
    partner.user = newUser._id;
    partner.status = 'approved';
    await partner.save({ session });

    // Save all changes
    await session.commitTransaction();
    session.endSession();

    // Create notification for partner
    try {
      await Notification.create({
        user: newUser._id,
        type: 'partner_approved',
        title: 'Partner Registration Approved',
        message: `Your partner registration for ${partner.shopName} has been approved! You can now login with your credentials.`,
        relatedEntity: {
          entityType: 'partner',
          entityId: partner._id,
        },
      });
    } catch (notifError) {
      // If notification fails, log it but don't fail the request
      console.error('Failed to create notification:', notifError);
    }

    return sendSuccess(res, 200, 'Partner approved successfully. Login credentials sent.', {
      partner: {
        id: partner._id,
        email: userEmail,
        partnerName: partner.partnerName,
        shopName: partner.shopName,
        status: partner.status,
      },
    });
  } catch (error) {
    // If something goes wrong, undo all changes
    await session.abortTransaction();
    session.endSession();

    // Handle validation errors from User schema (like password too short)
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return sendError(res, 400, 'Validation failed', validationErrors);
    }

    // Handle duplicate email error
    if (error.code === 11000) {
      return sendError(res, 400, 'Validation failed', [
        {
          field: 'email',
          message: 'Email already exists',
        },
      ]);
    }

    return sendError(res, 500, error.message);
  }
};

// @desc    Reject partner registration
// @route   PUT /api/admin/partners/:id/reject
// @access  Private (Admin)
export const rejectPartner = async (req, res) => {
  try {
    const { reason } = req.body;

    const partner = await Partner.findById(req.params.id).populate('user');

    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    partner.status = 'rejected';
    await partner.save();

    // Create notification for partner
    await Notification.create({
      user: partner.user._id,
      type: 'partner_rejected',
      title: 'Partner Registration Rejected',
      message: reason || `Your partner registration for ${partner.shopName} has been rejected. Please contact support for more information.`,
      relatedEntity: {
        entityType: 'partner',
        entityId: partner._id,
      },
    });

    return sendSuccess(res, 200, 'Partner rejected successfully', { partner });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get all offers
// @route   GET /api/admin/offers
// @access  Private (Admin)
export const getOffers = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const offers = await Offer.find(query)
      .populate('partner', 'partnerName shopName location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Offer.countDocuments(query);

    return sendSuccess(res, 200, 'Offers retrieved successfully', {
      offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete offer
// @route   DELETE /api/admin/offers/:id
// @access  Private (Admin)
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    await offer.deleteOne();

    return sendSuccess(res, 200, 'Offer deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // User statistics
    const totalUsers = await User.countDocuments();
    const totalMembers = await User.countDocuments({ role: 'member', ...dateQuery });
    const totalPartners = await User.countDocuments({ role: 'partner', ...dateQuery });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Partner statistics
    const totalPartnerProfiles = await Partner.countDocuments();
    const approvedPartners = await Partner.countDocuments({ status: 'approved' });
    const pendingPartners = await Partner.countDocuments({ status: 'pending' });
    const rejectedPartners = await Partner.countDocuments({ status: 'rejected' });

    // Offer statistics
    const totalOffers = await Offer.countDocuments(dateQuery);
    const activeOffers = await Offer.countDocuments({
      isActive: true,
      expiryDate: { $gt: new Date() },
      ...dateQuery,
    });
    const expiredOffers = await Offer.countDocuments({
      expiryDate: { $lte: new Date() },
      ...dateQuery,
    });

    // Analytics aggregation
    const offerAnalytics = await Offer.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$analytics.views' },
          totalClicks: { $sum: '$analytics.clicks' },
          totalRedemptions: { $sum: '$analytics.redemptions' },
        },
      },
    ]);

    // Review statistics
    const totalReviews = await Review.countDocuments(dateQuery);
    const averageRating = await Review.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const analytics = {
      users: {
        total: totalUsers,
        members: totalMembers,
        partners: totalPartners,
        active: activeUsers,
      },
      partners: {
        total: totalPartnerProfiles,
        approved: approvedPartners,
        pending: pendingPartners,
        rejected: rejectedPartners,
      },
      offers: {
        total: totalOffers,
        active: activeOffers,
        expired: expiredOffers,
        views: offerAnalytics[0]?.totalViews || 0,
        clicks: offerAnalytics[0]?.totalClicks || 0,
        redemptions: offerAnalytics[0]?.totalRedemptions || 0,
      },
      reviews: {
        total: totalReviews,
        averageRating: averageRating[0]?.avgRating || 0,
      },
    };

    return sendSuccess(res, 200, 'Analytics retrieved successfully', { analytics });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Generate monthly report
// @route   GET /api/admin/reports/monthly
// @access  Private (Admin)
export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth() + 1, 0, 23, 59, 59);

    const dateQuery = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // User registrations
    const newUsers = await User.countDocuments(dateQuery);
    const newMembers = await User.countDocuments({ role: 'member', ...dateQuery });
    const newPartners = await User.countDocuments({ role: 'partner', ...dateQuery });

    // Partner approvals
    const approvedPartners = await Partner.countDocuments({
      status: 'approved',
      updatedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // New offers
    const newOffers = await Offer.countDocuments(dateQuery);

    // Engagement metrics
    const offerAnalytics = await Offer.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$analytics.views' },
          totalClicks: { $sum: '$analytics.clicks' },
          totalRedemptions: { $sum: '$analytics.redemptions' },
        },
      },
    ]);

    // Reviews
    const newReviews = await Review.countDocuments(dateQuery);
    const averageRating = await Review.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const report = {
      period: {
        startDate,
        endDate,
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1,
      },
      users: {
        new: newUsers,
        newMembers,
        newPartners,
      },
      partners: {
        approved: approvedPartners,
      },
      offers: {
        new: newOffers,
        views: offerAnalytics[0]?.totalViews || 0,
        clicks: offerAnalytics[0]?.totalClicks || 0,
        redemptions: offerAnalytics[0]?.totalRedemptions || 0,
      },
      reviews: {
        new: newReviews,
        averageRating: averageRating[0]?.avgRating || 0,
      },
    };

    return sendSuccess(res, 200, 'Monthly report generated successfully', { report });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update partner premium status
// @route   PUT /api/admin/partners/:id/premium
// @access  Private (Admin)
export const updatePartnerPremiumStatus = async (req, res) => {
  try {
    const { isPremium } = req.body;

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    partner.isPremium = isPremium === true;
    await partner.save();

    return sendSuccess(res, 200, 'Partner premium status updated successfully', { partner });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

