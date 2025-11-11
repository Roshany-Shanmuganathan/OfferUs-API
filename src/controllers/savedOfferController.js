import SavedOffer from '../models/SavedOffer.js';
import Offer from '../models/Offer.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Save an offer
 * @route   POST /api/saved-offers
 * @access  Private (Member)
 */
export const saveOffer = async (req, res) => {
  try {
    const { offerId } = req.body;

    if (!offerId) {
      return sendError(res, 400, 'Offer ID is required');
    }

    const offer = await Offer.findById(offerId);

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

/**
 * @desc    Get saved offers
 * @route   GET /api/saved-offers
 * @access  Private (Member)
 */
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

/**
 * @desc    Remove saved offer
 * @route   DELETE /api/saved-offers/:offerId
 * @access  Private (Member)
 */
export const removeSavedOffer = async (req, res) => {
  try {
    const savedOffer = await SavedOffer.findOne({
      member: req.user._id,
      offer: req.params.offerId,
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

