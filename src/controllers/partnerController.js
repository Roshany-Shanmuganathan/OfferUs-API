import Partner from '../models/Partner.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Get partner profile
 * @route   GET /api/partners/profile
 * @access  Private (Partner)
 */
export const getPartnerProfile = async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user._id }).populate('userId', 'email');

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    return sendSuccess(res, 200, 'Partner profile retrieved successfully', { partner });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Update partner profile
 * @route   PUT /api/partners/profile
 * @access  Private (Partner)
 */
export const updatePartnerProfile = async (req, res) => {
  try {
    const {
      partnerName,
      shopName,
      location,
      category,
      contactInfo,
    } = req.body;

    const partner = await Partner.findOne({ userId: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    // Update fields
    if (partnerName) partner.partnerName = partnerName;
    if (shopName) partner.shopName = shopName;
    if (location) {
      partner.location = {
        ...partner.location,
        ...location,
      };
    }
    if (category) partner.category = category;
    if (contactInfo) {
      partner.contactInfo = {
        mobileNumber: contactInfo.mobileNumber || partner.contactInfo.mobileNumber,
        website: contactInfo.website !== undefined ? contactInfo.website : partner.contactInfo.website,
      };
    }

    // If status was rejected, reset to pending after update
    if (partner.status === 'rejected') {
      partner.status = 'pending';
    }

    await partner.save();

    return sendSuccess(res, 200, 'Partner profile updated successfully', { partner });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get partner analytics
 * @route   GET /api/partners/analytics
 * @access  Private (Partner)
 */
export const getPartnerAnalytics = async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const Offer = (await import('../models/Offer.js')).default;
    const offers = await Offer.find({ partner: partner._id });

    const analytics = {
      totalOffers: offers.length,
      activeOffers: offers.filter((o) => o.isActive && new Date(o.expiryDate) > new Date()).length,
      totalViews: offers.reduce((sum, o) => sum + o.analytics.views, 0),
      totalClicks: offers.reduce((sum, o) => sum + o.analytics.clicks, 0),
      totalRedemptions: offers.reduce((sum, o) => sum + o.analytics.redemptions, 0),
      offers: offers.map((offer) => ({
        id: offer._id,
        title: offer.title,
        views: offer.analytics.views,
        clicks: offer.analytics.clicks,
        redemptions: offer.analytics.redemptions,
      })),
    };

    return sendSuccess(res, 200, 'Analytics retrieved successfully', { analytics });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin functions for partner management
// @desc    Get all partners (pending, approved, rejected)
// @route   GET /api/partners
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
      .populate('userId', 'email isActive')
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
// @route   GET /api/partners/pending
// @access  Private (Admin)
export const getPendingPartners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const partners = await Partner.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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

// @desc    Approve partner registration
// @route   PATCH /api/partners/:id/approve
// @access  Private (Admin)
export const approvePartner = async (req, res) => {
  try {
    const partnerId = req.params.id;
    const partner = await Partner.findById(partnerId).populate('userId', 'email');

    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    if (partner.status === 'approved') {
      return sendError(res, 400, 'Validation failed', [
        {
          field: 'status',
          message: 'Partner is already approved',
        },
      ]);
    }

    if (!partner.userId) {
      return sendError(res, 400, 'Partner user account not found');
    }

    partner.status = 'approved';
    partner.verifiedAt = new Date();
    await partner.save();

    try {
      await Notification.create({
        user: partner.userId._id,
        type: 'partner_approved',
        title: 'Partner Registration Approved',
        message: `Your partner registration for ${partner.shopName} has been approved! You can now login with your credentials.`,
        relatedEntity: {
          entityType: 'partner',
          entityId: partner._id,
        },
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    return sendSuccess(res, 200, 'Partner approved successfully', {
      partner: {
        id: partner._id,
        email: partner.userId.email,
        partnerName: partner.partnerName,
        shopName: partner.shopName,
        status: partner.status,
        verifiedAt: partner.verifiedAt,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return sendError(res, 400, 'Validation failed', validationErrors);
    }
    return sendError(res, 500, error.message);
  }
};

// @desc    Reject partner registration
// @route   PATCH /api/partners/:id/reject
// @access  Private (Admin)
export const rejectPartner = async (req, res) => {
  try {
    const { reason } = req.body;
    const partner = await Partner.findById(req.params.id).populate('userId', 'email');

    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    partner.status = 'rejected';
    partner.reason = reason || undefined;
    await partner.save();

    if (partner.userId) {
      try {
        await Notification.create({
          user: partner.userId._id,
          type: 'partner_rejected',
          title: 'Partner Registration Rejected',
          message: reason || `Your partner registration for ${partner.shopName} has been rejected. Please contact support for more information.`,
          relatedEntity: {
            entityType: 'partner',
            entityId: partner._id,
          },
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }

    return sendSuccess(res, 200, 'Partner rejected successfully', { partner });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update partner premium status
// @route   PUT /api/partners/:id/premium
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
