import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Get notifications
 * @route   GET /api/notifications
 * @access  Private (Member, Partner, Admin)
 */
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (type) {
      // Allow multiple types separated by comma
      const types = type.split(',');
      query.type = { $in: types };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
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

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (Member, Partner, Admin)
 */
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

