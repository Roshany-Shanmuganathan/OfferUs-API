import Partner from '../models/Partner.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Get partner profile
 * @route   GET /api/partners/profile
 * @access  Private (Partner)
 */
export const getPartnerProfile = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id }).populate('user', 'email profile');

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

    const partner = await Partner.findOne({ user: req.user._id });

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
    const partner = await Partner.findOne({ user: req.user._id });

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
