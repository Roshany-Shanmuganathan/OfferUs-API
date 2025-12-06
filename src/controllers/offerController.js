import Offer from '../models/Offer.js';
import Partner from '../models/Partner.js';
import SavedOffer from '../models/SavedOffer.js';
import Category from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';
import { notifyNewOffer } from '../utils/notificationService.js';

/**
 * @desc    Browse all active offers (Public)
 * @route   GET /api/offers
 * @access  Public (Optional authentication)
 */
export const browseOffers = async (req, res) => {
  try {
    const { category, city, search, page = 1, limit = 10, sortBy } = req.query;

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
      
      // If no partners found for the city, return empty results
      if (partners.length === 0) {
        return sendSuccess(res, 200, 'Offers retrieved successfully', {
          offers: [],
          isAuthenticated: !!req.user,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }
      
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

    // Determine sort order based on sortBy parameter
    // Normalize sortBy to lowercase to handle case variations
    const normalizedSortBy = sortBy ? String(sortBy).toLowerCase() : 'newest';
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    switch (normalizedSortBy) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'discount-high':
        sortOption = { discount: -1 };
        break;
      case 'discount-low':
        sortOption = { discount: 1 };
        break;
      case 'price-low':
        sortOption = { discountedPrice: 1 };
        break;
      case 'price-high':
        sortOption = { discountedPrice: -1 };
        break;
      case 'expiring':
        // Sort by expiry date ascending (earliest expiry first = expiring soon)
        sortOption = { expiryDate: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    console.log('Sorting by:', normalizedSortBy, 'Sort option:', sortOption); // Debug log

    const offers = await Offer.find(query)
      .populate('partner', 'partnerName shopName location category')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Offer.countDocuments(query);
    
    // Debug: Log query details to help diagnose issues
    console.log('=== Browse Offers Debug ===');
    console.log('Query filters:', JSON.stringify(query, null, 2));
    console.log('Total offers matching query:', total);
    
    // Check total offers in database (for debugging)
    const totalOffersInDB = await Offer.countDocuments({});
    const activeOffers = await Offer.countDocuments({ isActive: true });
    const expiredOffers = await Offer.countDocuments({ expiryDate: { $lte: new Date() } });
    const activeNonExpired = await Offer.countDocuments({ 
      isActive: true, 
      expiryDate: { $gt: new Date() } 
    });
    
    console.log('Total offers in DB:', totalOffersInDB);
    console.log('Active offers:', activeOffers);
    console.log('Expired offers:', expiredOffers);
    console.log('Active & non-expired offers:', activeNonExpired);
    console.log('==========================');

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

/**
 * @desc    Get a single offer (Public)
 * @route   GET /api/offers/:id
 * @access  Public (Optional authentication)
 */
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

/**
 * @desc    Click on an offer (increment clicks)
 * @route   POST /api/offers/:id/click
 * @access  Public (Optional authentication)
 */
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

/**
 * @desc    Get categories
 * @route   GET /api/offers/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    // Get predefined categories from Category model
    const predefinedCategories = await Category.find({ isActive: true })
      .select('name')
      .sort({ name: 1 });
    
    const predefinedCategoryNames = predefinedCategories.map((cat) => cat.name);
    
    // Get categories from existing offers
    const offerCategories = await Offer.distinct('category', {
      isActive: true,
      expiryDate: { $gt: new Date() },
    });
    
    // Combine and remove duplicates, sort alphabetically
    const allCategories = [...new Set([...predefinedCategoryNames, ...offerCategories])].sort();

    return sendSuccess(res, 200, 'Categories retrieved successfully', { categories: allCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Add a new category (Admin only)
 * @route   POST /api/offers/categories
 * @access  Private (Admin)
 */
export const addCategory = async (req, res) => {
  try {
    console.log('addCategory called with body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { name } = req.body;

    if (!name) {
      console.error('Category name is missing');
      return sendError(res, 400, 'Category name is required');
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      console.error('Category name is invalid:', name);
      return sendError(res, 400, 'Category name must be a non-empty string');
    }

    // Normalize category name (uppercase, trim)
    const normalizedName = name.trim().toUpperCase();

    // Check if Category model is available
    if (!Category) {
      console.error('Category model is not available');
      return sendError(res, 500, 'Category model not initialized');
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: normalizedName });

    if (existingCategory) {
      if (existingCategory.isActive) {
        return sendError(res, 400, 'Category already exists');
      } else {
        // Reactivate inactive category
        existingCategory.isActive = true;
        await existingCategory.save();
        return sendSuccess(res, 200, 'Category reactivated successfully', {
          category: existingCategory.name,
        });
      }
    }

    // Create new category
    const category = await Category.create({
      name: normalizedName,
      isActive: true,
    });

    return sendSuccess(res, 201, 'Category added successfully', { category: category.name });
  } catch (error) {
    console.error('Error adding category:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 11000) {
      return sendError(res, 400, 'Category already exists');
    }
    
    // Return detailed error for debugging
    const errorMessage = error.message || 'Failed to add category';
    return sendError(res, 500, `Server error: ${errorMessage}`);
  }
};

/**
 * @desc    Delete a category (Admin only)
 * @route   DELETE /api/offers/categories/:name
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const categoryName = decodeURIComponent(req.params.name).toUpperCase();

    const category = await Category.findOne({ name: categoryName });
    
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Check if any active offers are using this category
    const offersWithCategory = await Offer.countDocuments({
      category: categoryName,
      isActive: true,
      expiryDate: { $gt: new Date() },
    });

    if (offersWithCategory > 0) {
      // Deactivate instead of delete if offers exist
      category.isActive = false;
      await category.save();
      return sendSuccess(res, 200, 'Category deactivated successfully (offers still using it)');
    }

    // Delete if no active offers use it
    await category.deleteOne();

    return sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    return sendError(res, 500, error.message || 'Failed to delete category');
  }
};

/**
 * @desc    Create a new offer
 * @route   POST /api/offers
 * @access  Private (Partner)
 */
export const createOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user._id });

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

/**
 * @desc    Get all offers for a partner
 * @route   GET /api/offers/partner
 * @access  Private (Partner)
 */
export const getPartnerOffers = async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user._id });

    if (!partner) {
      return sendError(res, 404, 'Partner profile not found');
    }

    const offers = await Offer.find({ partner: partner._id }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Offers retrieved successfully', { offers });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get a single partner offer
 * @route   GET /api/offers/:id/partner
 * @access  Private (Partner)
 */
export const getPartnerOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user._id });

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

/**
 * @desc    Update an offer
 * @route   PUT /api/offers/:id
 * @access  Private (Partner)
 */
export const updateOffer = async (req, res) => {
  try {
    const partner = await Partner.findOne({ userId: req.user._id });

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

/**
 * @desc    Delete an offer
 * @route   DELETE /api/offers/:id
 * @access  Private (Partner, Admin)
 */
export const deleteOffer = async (req, res) => {
  try {
    let offer;

    // Partners can only delete their own offers
    if (req.user.role === 'partner') {
      const partner = await Partner.findOne({ userId: req.user._id });
      if (!partner) {
        return sendError(res, 404, 'Partner profile not found');
      }

      offer = await Offer.findOne({
        _id: req.params.id,
        partner: partner._id,
      });
    } else {
      // Admin can delete any offer
      offer = await Offer.findById(req.params.id);
    }

    if (!offer) {
      return sendError(res, 404, 'Offer not found');
    }

    await offer.deleteOne();

    return sendSuccess(res, 200, 'Offer deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Redeem an offer (increment redemptions)
 * @route   POST /api/offers/:id/redeem
 * @access  Private (Member)
 */
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

// Admin function for offer management
// @desc    Get all offers (admin view with filters)
// @route   GET /api/offers/admin/all
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

