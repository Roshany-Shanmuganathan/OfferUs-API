import Partner from '../models/Partner.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';
import { notifyNewOffer } from '../utils/notificationService.js';

// @desc    Get partner profile
// @route   GET /api/partners/profile
// @access  Private (Partner)
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

// @desc    Update partner profile
// @route   PUT /api/partners/profile
// @access  Private (Partner)
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

// @desc    Create a new offer
// @route   POST /api/partners/offers
// @access  Private (Partner)
export const createOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const {
      title,
      description,
      discount,
      originalPrice,
      discountedPrice,
      category,
      expiryDate,
      imageUrl,
      termsAndConditions,
    } = req.body;

    // Validate discount calculation
    const calculatedDiscount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    if (Math.abs(calculatedDiscount - discount) > 1) {
      return sendError(res, 400, 'Discount percentage does not match price difference');
    }

    const offer = await Offer.create({
      partner: partner._id,
      title,
      description,
      discount,
      originalPrice,
      discountedPrice,
      category: category || partner.category,
      expiryDate,
      imageUrl,
      termsAndConditions,
      isActive: true,
    });

    // Notify all members about the new offer (async, don't wait)
    notifyNewOffer(offer, partner).catch((err) => {
      console.error('Error notifying members about new offer:', err);
    });

    return sendSuccess(res, 201, 'Offer created successfully', { offer });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get all offers for a partner
// @route   GET /api/partners/offers
// @access  Private (Partner)
export const getPartnerOffers = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const offers = await Offer.find({ partner: partner._id }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Offers retrieved successfully', { offers });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get a single offer
// @route   GET /api/partners/offers/:id
// @access  Private (Partner)
export const getPartnerOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const offer = await Offer.findOne({
      _id: req.params.id,
      partner: partner._id,
    });

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    return sendSuccess(res, 200, 'Offer retrieved successfully', { offer });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Update an offer
// @route   PUT /api/partners/offers/:id
// @access  Private (Partner)
export const updateOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const offer = await Offer.findOne({
      _id: req.params.id,
      partner: partner._id,
    });

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    const {
      title,
      description,
      discount,
      originalPrice,
      discountedPrice,
      category,
      expiryDate,
      imageUrl,
      termsAndConditions,
      isActive,
    } = req.body;

    // Update fields
    if (title) offer.title = title;
    if (description) offer.description = description;
    if (discount !== undefined) offer.discount = discount;
    if (originalPrice) offer.originalPrice = originalPrice;
    if (discountedPrice) offer.discountedPrice = discountedPrice;
    if (category) offer.category = category;
    if (expiryDate) offer.expiryDate = expiryDate;
    if (imageUrl !== undefined) offer.imageUrl = imageUrl;
    if (termsAndConditions !== undefined) offer.termsAndConditions = termsAndConditions;
    if (isActive !== undefined) offer.isActive = isActive;

    await offer.save();

    return sendSuccess(res, 200, 'Offer updated successfully', { offer });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Delete an offer
// @route   DELETE /api/partners/offers/:id
// @access  Private (Partner)
export const deleteOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const offer = await Offer.findOne({
      _id: req.params.id,
      partner: partner._id,
    });

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    await offer.deleteOne();

    return sendSuccess(res, 200, 'Offer deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get partner analytics
// @route   GET /api/partners/analytics
// @access  Private (Partner)
export const getPartnerAnalytics = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

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

// @desc    Get partner reviews
// @route   GET /api/partners/reviews
// @access  Private (Partner)
export const getPartnerReviews = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const reviews = await Review.find({ partner: partner._id })
      .populate('member', 'profile')
      .populate('offer', 'title')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Reviews retrieved successfully', { reviews });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Respond to a review
// @route   PUT /api/partners/reviews/:id/respond
// @access  Private (Partner)
export const respondToReview = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const { response } = req.body;

    if (!response) {
      return sendError(res, 400, 'Response is required');
    }

    const review = await Review.findOne({
      _id: req.params.id,
      partner: partner._id,
    });

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    review.partnerResponse = response;
    review.responseDate = new Date();
    await review.save();

    return sendSuccess(res, 200, 'Response added successfully', { review });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

