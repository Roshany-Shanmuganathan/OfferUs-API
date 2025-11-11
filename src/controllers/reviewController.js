import Review from '../models/Review.js';
import Offer from '../models/Offer.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Create a review for an offer
 * @route   POST /api/reviews
 * @access  Private (Member)
 */
export const createReview = async (req, res) => {
  try {
    const { rating, comment, offerId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Rating must be between 1 and 5');
    }

    if (!offerId) {
      return sendError(res, 400, 'Offer ID is required');
    }

    const offer = await Offer.findById(offerId).populate('partner');

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

/**
 * @desc    Get reviews for an offer
 * @route   GET /api/offers/:id/reviews or /api/reviews/offers/:offerId
 * @access  Public
 */
export const getOfferReviews = async (req, res) => {
  try {
    // Support both route patterns: /offers/:id/reviews and /reviews/offers/:offerId
    const offerId = req.params.id || req.params.offerId;
    
    const reviews = await Review.find({ offer: offerId })
      .populate('member', 'profile')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Reviews retrieved successfully', { reviews });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get reviews for a partner
 * @route   GET /api/reviews/partner
 * @access  Private (Partner)
 */
export const getPartnerReviews = async (req, res) => {
  try {
    const Partner = (await import('../models/Partner.js')).default;
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

/**
 * @desc    Respond to a review
 * @route   PUT /api/reviews/:id/respond
 * @access  Private (Partner)
 */
export const respondToReview = async (req, res) => {
  try {
    const Partner = (await import('../models/Partner.js')).default;
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

