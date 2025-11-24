import User from '../models/User.js';
import Partner from '../models/Partner.js';
import Member from '../models/Member.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import SavedOffer from '../models/SavedOffer.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

// @desc    Get all users
// @route   GET /api/users
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
// @route   GET /api/users/:id
// @access  Private (Admin)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    let additionalData = {};

    if (user.role === 'partner') {
      const partner = await Partner.findOne({ userId: user._id });
      additionalData.partner = partner;
    }

    if (user.role === 'member') {
      const member = await Member.findOne({ userId: user._id });
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
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const { isActive, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return sendSuccess(res, 200, 'User updated successfully', { user: userResponse });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // If partner, delete partner profile and offers
    if (user.role === 'partner') {
      const partner = await Partner.findOne({ userId: user._id });
      if (partner) {
        await Offer.deleteMany({ partner: partner._id });
        await Partner.findByIdAndDelete(partner._id);
      }
    }

    // If member, delete member profile
    if (user.role === 'member') {
      await Member.findOneAndDelete({ userId: user._id });
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

