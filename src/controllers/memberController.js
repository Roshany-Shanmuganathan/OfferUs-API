import Offer from '../models/Offer.js';
import Partner from '../models/Partner.js';
import Review from '../models/Review.js';
import SavedOffer from '../models/SavedOffer.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

// @desc    Get all active offers (browse) - Public access
// @route   GET /api/offers
// @access  Public (Optional authentication for enhanced features)
export const browseOffers = async (req, res) => {
  try {
    const { category, city, search, page = 1, limit = 10 } = req.query;

    const query = {
      isActive: true,
      expiryDate: { $gt: new Date() },
    };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by city
    if (city) {
      const partners = await Partner.find({
        'location.city': new RegExp(city, 'i'),
      }).select('_id');
      query.partner = { $in: partners.map((p) => p._id) };
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;

    const offers = await Offer.find(query)
      .populate('partner', 'partnerName shopName location category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Offer.countDocuments(query);

    // Increment views for each offer (track analytics)
    await Offer.updateMany(
      { _id: { $in: offers.map((o) => o._id) } },
      { $inc: { 'analytics.views': 1 } }
    );

    // If user is logged in, check which offers are saved
    let savedOfferIds = [];
    if (req.user && req.user.role === 'member') {
      const savedOffers = await SavedOffer.find({
        member: req.user._id,
        offer: { $in: offers.map((o) => o._id) },
      }).select('offer');
      savedOfferIds = savedOffers.map((so) => so.offer.toString());
    }

    // Add isSaved flag to each offer if user is logged in
    const offersWithSavedFlag = offers.map((offer) => {
      const offerObj = offer.toObject();
      if (req.user && req.user.role === 'member') {
        offerObj.isSaved = savedOfferIds.includes(offer._id.toString());
      }
      return offerObj;
    });

    return sendSuccess(res, 200, 'Offers retrieved successfully', {
      offers: offersWithSavedFlag,
      isAuthenticated: !!req.user,
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

// @desc    Get a single offer - Public access
// @route   GET /api/offers/:id
// @access  Public (Optional authentication for enhanced features)
export const getOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      _id: req.params.id,
      isActive: true,
      expiryDate: { $gt: new Date() },
    }).populate('partner', 'partnerName shopName location category contactInfo');

    if (!offer) {
      return sendError(res, 404, 'Offer not found or expired');
    }

    // Increment views
    offer.analytics.views += 1;
    await offer.save();

    const offerObj = offer.toObject();

    // If user is logged in, check if offer is saved
    if (req.user && req.user.role === 'member') {
      const savedOffer = await SavedOffer.findOne({
        member: req.user._id,
        offer: offer._id,
      });
      offerObj.isSaved = !!savedOffer;
    }

    return sendSuccess(res, 200, 'Offer retrieved successfully', {
      offer: offerObj,
      isAuthenticated: !!req.user,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Click on an offer (increment clicks) - Public access
// @route   POST /api/offers/:id/click
// @access  Public (Optional authentication)
export const clickOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    offer.analytics.clicks += 1;
    await offer.save();

    return sendSuccess(res, 200, 'Click recorded successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Redeem an offer (increment redemptions)
// @route   POST /api/members/offers/:id/redeem
// @access  Private (Member)
export const redeemOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    if (!offer.isActive || new Date(offer.expiryDate) < new Date()) {
      return sendError(res, 400, 'Offer is not active or has expired');
    }

    offer.analytics.redemptions += 1;
    await offer.save();

    return sendSuccess(res, 200, 'Offer redeemed successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Save an offer
// @route   POST /api/members/offers/:id/save
// @access  Private (Member)
export const saveOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    // Check if already saved
    const existingSave = await SavedOffer.findOne({
      member: req.user._id,
      offer: offer._id,
    });

    if (existingSave) {
      return sendError(res, 400, 'Offer already saved');
    }

    await SavedOffer.create({
      member: req.user._id,
      offer: offer._id,
    });

    return sendSuccess(res, 201, 'Offer saved successfully');
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Offer already saved');
    }
    return sendError(res, 500, error.message);
  }
};

// @desc    Get saved offers
// @route   GET /api/members/offers/saved
// @access  Private (Member)
export const getSavedOffers = async (req, res) => {
  try {
    const savedOffers = await SavedOffer.find({ member: req.user._id })
      .populate({
        path: 'offer',
        populate: {
          path: 'partner',
          select: 'partnerName shopName location category',
        },
      })
      .sort({ createdAt: -1 });

    const offers = savedOffers
      .filter((so) => so.offer && so.offer.isActive && new Date(so.offer.expiryDate) > new Date())
      .map((so) => so.offer);

    return sendSuccess(res, 200, 'Saved offers retrieved successfully', { offers });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Remove saved offer
// @route   DELETE /api/members/offers/:id/save
// @access  Private (Member)
export const removeSavedOffer = async (req, res) => {
  try {
    const savedOffer = await SavedOffer.findOne({
      member: req.user._id,
      offer: req.params.id,
    });

    if (!savedOffer) {
      return sendError(res, 404, 'Saved offer not found');
    }

    await savedOffer.deleteOne();

    return sendSuccess(res, 200, 'Offer removed from saved list');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Rate and review an offer
// @route   POST /api/members/offers/:id/review
// @access  Private (Member)
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Rating must be between 1 and 5');
    }

    const offer = await Offer.findById(req.params.id).populate('partner');

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      member: req.user._id,
      offer: offer._id,
    });

    if (existingReview) {
      return sendError(res, 400, 'You have already reviewed this offer');
    }

    const review = await Review.create({
      member: req.user._id,
      partner: offer.partner._id,
      offer: offer._id,
      rating,
      comment,
    });

    // Create notification for partner
    await Notification.create({
      user: offer.partner.user,
      type: 'new_review',
      title: 'New Review',
      message: `You received a new ${rating}-star review for "${offer.title}"`,
      relatedEntity: {
        entityType: 'review',
        entityId: review._id,
      },
    });

    return sendSuccess(res, 201, 'Review created successfully', { review });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'You have already reviewed this offer');
    }
    return sendError(res, 500, error.message);
  }
};

// @desc    Get reviews for an offer - Public access
// @route   GET /api/offers/:id/reviews
// @access  Public
export const getOfferReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ offer: req.params.id })
      .populate('member', 'profile')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Reviews retrieved successfully', { reviews });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get notifications
// @route   GET /api/members/notifications
// @access  Private (Member)
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ user: req.user._id });
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return sendSuccess(res, 200, 'Notifications retrieved successfully', {
      notifications,
      unreadCount,
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

// @desc    Mark notification as read
// @route   PUT /api/members/notifications/:id/read
// @access  Private (Member)
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 200, 'Notification marked as read');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @desc    Get categories - Public access
// @route   GET /api/offers/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Offer.distinct('category', {
      isActive: true,
      expiryDate: { $gt: new Date() },
    });

    return sendSuccess(res, 200, 'Categories retrieved successfully', { categories });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

