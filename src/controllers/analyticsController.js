import User from "../models/User.js";
import Partner from "../models/Partner.js";
import Offer from "../models/Offer.js";
import Review from "../models/Review.js";
import { sendSuccess, sendError } from "../utils/responseFormat.js";

// @desc    Get platform analytics
// @route   GET /api/analytics
// @access  Private (Admin)
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        // Set to start of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateQuery.createdAt.$gte = start;
      }
      if (endDate) {
        // Set to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
    }

    // User statistics
    const totalUsers = await User.countDocuments();
    const totalMembers = await User.countDocuments({
      role: "member",
      ...dateQuery,
    });
    const totalPartners = await User.countDocuments({
      role: "partner",
      ...dateQuery,
    });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Partner statistics
    const totalPartnerProfiles = await Partner.countDocuments();
    const approvedPartners = await Partner.countDocuments({
      status: "approved",
    });
    const pendingPartners = await Partner.countDocuments({ status: "pending" });
    const rejectedPartners = await Partner.countDocuments({
      status: "rejected",
    });

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

    // Analytics aggregation - only add $match if dateQuery has filters
    const offerAggregationPipeline = [];
    if (Object.keys(dateQuery).length > 0) {
      offerAggregationPipeline.push({ $match: dateQuery });
    }
    offerAggregationPipeline.push({
      $group: {
        _id: null,
        totalViews: { $sum: "$analytics.views" },
        totalClicks: { $sum: "$analytics.clicks" },
        totalRedemptions: { $sum: "$analytics.redemptions" },
      },
    });
    const offerAnalytics = await Offer.aggregate(offerAggregationPipeline);

    // Review statistics
    const totalReviews = await Review.countDocuments(dateQuery);
    const reviewAggregationPipeline = [];
    if (Object.keys(dateQuery).length > 0) {
      reviewAggregationPipeline.push({ $match: dateQuery });
    }
    reviewAggregationPipeline.push({
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
      },
    });
    const averageRating = await Review.aggregate(reviewAggregationPipeline);

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

    return sendSuccess(res, 200, "Analytics retrieved successfully", {
      analytics,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
