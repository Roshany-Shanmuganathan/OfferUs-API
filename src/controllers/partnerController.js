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

// @desc    Ban a partner (admin only)
// @route   PATCH /api/partners/:id/ban
// @access  Private (Admin)
export const banPartner = async (req, res) => {
  try {
    const { reason } = req.body;
    const partnerId = req.params.id;
    
    console.log('=== BAN PARTNER REQUEST ===');
    console.log('Partner ID:', partnerId);
    console.log('Reason:', reason);

    // Find partner without populate first to avoid issues
    let partner = await Partner.findById(partnerId);
    
    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    console.log('Partner found:', {
      id: partner._id,
      shopName: partner.shopName,
      status: partner.status,
      userId: partner.userId,
    });

    // Check if partner is already banned
    if (partner.status === 'banned') {
      return sendError(res, 400, 'Partner is already banned');
    }

    // Cannot ban if not approved (must be approved first)
    if (partner.status !== 'approved') {
      return sendError(res, 400, 'Only approved partners can be banned');
    }

    // Update partner status to banned
    partner.status = 'banned';
    partner.bannedAt = new Date();
    partner.banReason = reason || 'Violation of terms and conditions';
    
    try {
      await partner.save();
      console.log('Partner status updated to banned');
    } catch (saveError) {
      console.error('Error saving partner:', saveError);
      throw saveError;
    }

    // Disable all offers for this partner
    let updateResult = { modifiedCount: 0 };
    try {
      const Offer = (await import('../models/Offer.js')).default;
      updateResult = await Offer.updateMany(
        { partner: partner._id, isActive: true },
        { $set: { isActive: false } }
      );
      console.log(`Disabled ${updateResult.modifiedCount} offers for banned partner ${partner.shopName}`);
    } catch (offerError) {
      console.error('Error disabling offers:', offerError);
      // Continue even if offer update fails
    }

    // Send notification to partner
    // Get userId (it's an ObjectId reference)
    const userId = partner.userId;
    if (userId) {
      try {
        await Notification.create({
          user: userId,
          type: 'system',
          title: 'Account Banned',
          message: `Your partner account for ${partner.shopName} has been banned. Reason: ${partner.banReason}. All your offers have been disabled.`,
          relatedEntity: {
            entityType: 'partner',
            entityId: partner._id,
          },
        });
        console.log('Notification created successfully');
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        console.error('Notification error details:', {
          message: notifError.message,
          name: notifError.name,
          errors: notifError.errors,
        });
        // Don't fail the ban operation if notification fails
      }
    } else {
      console.warn('No userId found for partner, skipping notification');
    }

    // Get email for response - populate userId if needed
    let email = null;
    try {
      // Check if userId is already populated (has email property)
      if (partner.userId && typeof partner.userId === 'object' && partner.userId.email) {
        email = partner.userId.email;
      } else if (partner.userId) {
        // Need to populate to get email
        await partner.populate('userId', 'email');
        email = partner.userId?.email || null;
      }
    } catch (populateError) {
      console.error('Error populating userId for response:', populateError);
      // Continue without email if populate fails
    }

    return sendSuccess(res, 200, 'Partner banned successfully', {
      partner: {
        id: partner._id,
        email: email,
        partnerName: partner.partnerName,
        shopName: partner.shopName,
        status: partner.status,
        bannedAt: partner.bannedAt,
        banReason: partner.banReason,
        offersDisabled: updateResult?.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error('=== ERROR BANNING PARTNER ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    console.error('Partner ID:', req.params.id);
    return sendError(res, 500, error.message || 'Failed to ban partner');
  }
};

// @desc    Unban a partner (admin only)
// @route   PATCH /api/partners/:id/unban
// @access  Private (Admin)
export const unbanPartner = async (req, res) => {
  try {
    const partnerId = req.params.id;
    const partner = await Partner.findById(partnerId).populate('userId', 'email');

    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    // Check if partner is actually banned
    if (partner.status !== 'banned') {
      return sendError(res, 400, 'Partner is not banned');
    }

    // Restore partner status to approved
    partner.status = 'approved';
    partner.bannedAt = undefined;
    const previousBanReason = partner.banReason;
    partner.banReason = undefined;
    await partner.save();

    // Reactivate all non-expired offers for this partner
    const Offer = (await import('../models/Offer.js')).default;
    const now = new Date();
    const updateResult = await Offer.updateMany(
      {
        partner: partner._id,
        isActive: false,
        expiryDate: { $gt: now }, // Only reactivate non-expired offers
      },
      { $set: { isActive: true } }
    );

    console.log(`Reactivated ${updateResult.modifiedCount} offers for unbanned partner ${partner.shopName}`);

    // Send notification to partner
    // Handle both populated and non-populated userId
    const userId = partner.userId?._id || partner.userId;
    if (userId) {
      try {
        await Notification.create({
          user: userId,
          type: 'system',
          title: 'Account Unbanned',
          message: `Your partner account for ${partner.shopName} has been unbanned. Your offers have been reactivated.`,
          relatedEntity: {
            entityType: 'partner',
            entityId: partner._id,
          },
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the unban operation if notification fails
      }
    }

    // Get email for response (handle both populated and non-populated)
    const email = partner.userId?.email || null;

    return sendSuccess(res, 200, 'Partner unbanned successfully', {
      partner: {
        id: partner._id,
        email: email,
        partnerName: partner.partnerName,
        shopName: partner.shopName,
        status: partner.status,
        previousBanReason: previousBanReason,
        offersReactivated: updateResult.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error unbanning partner:', error);
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete a partner (admin only)
// @route   DELETE /api/partners/:id
// @access  Private (Admin)
export const deletePartner = async (req, res) => {
  try {
    const partnerId = req.params.id;
    const partner = await Partner.findById(partnerId).populate('userId', 'email');

    if (!partner) {
      return sendError(res, 404, 'Partner not found');
    }

    // Rule: Cannot delete approved partners
    if (partner.status === 'approved') {
      return sendError(res, 403, 'Cannot delete approved partners. Use ban instead if you need to restrict access.');
    }

    // For pending/rejected partners, we can delete
    // But first, we should handle related data:
    // - Delete or handle associated offers
    // - Delete or handle associated reviews
    // - Delete notifications related to this partner

    const Offer = (await import('../models/Offer.js')).default;
    const Review = (await import('../models/Review.js')).default;
    const SavedOffer = (await import('../models/SavedOffer.js')).default;

    // Get offer IDs before deletion
    const offerIds = await Offer.find({ partner: partner._id }).distinct('_id');

    // Count related data
    const offersCount = offerIds.length;
    const reviewsCount = await Review.countDocuments({ partner: partner._id });
    const savedOffersCount = offerIds.length > 0 
      ? await SavedOffer.countDocuments({ offer: { $in: offerIds } })
      : 0;

    // Delete saved offers that reference partner's offers
    if (offerIds.length > 0) {
      await SavedOffer.deleteMany({ offer: { $in: offerIds } });
    }

    // Delete related reviews
    await Review.deleteMany({ partner: partner._id });

    // Delete related offers (cascade delete)
    await Offer.deleteMany({ partner: partner._id });

    // Delete partner
    await Partner.findByIdAndDelete(partnerId);

    return sendSuccess(res, 200, 'Partner deleted successfully', {
      deletedPartner: {
        id: partner._id,
        email: partner.userId?.email,
        partnerName: partner.partnerName,
        shopName: partner.shopName,
        status: partner.status,
      },
      relatedDataDeleted: {
        offers: offersCount,
        reviews: reviewsCount,
        savedOffers: savedOffersCount,
      },
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
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
