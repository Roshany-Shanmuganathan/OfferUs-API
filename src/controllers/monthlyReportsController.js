import User from '../models/User.js';
import Partner from '../models/Partner.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

// @desc    Generate monthly report
// @route   GET /api/monthly-reports
// @access  Private (Admin)
export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth() + 1, 0, 23, 59, 59);

    const dateQuery = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // User registrations
    const newUsers = await User.countDocuments(dateQuery);
    const newMembers = await User.countDocuments({ role: 'member', ...dateQuery });
    const newPartners = await User.countDocuments({ role: 'partner', ...dateQuery });

    // Partner approvals
    const approvedPartners = await Partner.countDocuments({
      status: 'approved',
      updatedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // New offers
    const newOffers = await Offer.countDocuments(dateQuery);

    // Engagement metrics
    const offerAnalytics = await Offer.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$analytics.views' },
          totalClicks: { $sum: '$analytics.clicks' },
          totalRedemptions: { $sum: '$analytics.redemptions' },
        },
      },
    ]);

    // Reviews
    const newReviews = await Review.countDocuments(dateQuery);
    const averageRating = await Review.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const report = {
      period: {
        startDate,
        endDate,
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1,
      },
      users: {
        new: newUsers,
        newMembers,
        newPartners,
      },
      partners: {
        approved: approvedPartners,
      },
      offers: {
        new: newOffers,
        views: offerAnalytics[0]?.totalViews || 0,
        clicks: offerAnalytics[0]?.totalClicks || 0,
        redemptions: offerAnalytics[0]?.totalRedemptions || 0,
      },
      reviews: {
        new: newReviews,
        averageRating: averageRating[0]?.avgRating || 0,
      },
    };

    return sendSuccess(res, 200, 'Monthly report generated successfully', { report });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

