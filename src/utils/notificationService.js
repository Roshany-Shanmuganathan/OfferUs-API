import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Offer from '../models/Offer.js';

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, type, title, message, relatedEntity = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedEntity,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify all members about a new offer
 */
export const notifyNewOffer = async (offer, partner) => {
  try {
    const members = await User.find({ role: 'member', isActive: true }).select('_id');

    const notifications = members.map((member) =>
      Notification.create({
        user: member._id,
        type: 'new_offer',
        title: 'New Offer Available',
        message: `${partner.shopName} has a new offer: ${offer.title}`,
        relatedEntity: {
          entityType: 'offer',
          entityId: offer._id,
        },
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying members about new offer:', error);
  }
};

/**
 * Notify members about expiring offers
 */
export const notifyExpiringOffers = async () => {
  try {
    // Find offers expiring in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringOffers = await Offer.find({
      isActive: true,
      expiryDate: {
        $gte: new Date(),
        $lte: tomorrow,
      },
    }).populate('partner', 'shopName');

    for (const offer of expiringOffers) {
      // Find members who saved this offer
      const SavedOffer = (await import('../models/SavedOffer.js')).default;
      const savedOffers = await SavedOffer.find({ offer: offer._id }).populate('member');

      const notifications = savedOffers.map((savedOffer) =>
        Notification.create({
          user: savedOffer.member._id,
          type: 'expiring_offer',
          title: 'Offer Expiring Soon',
          message: `${offer.title} from ${offer.partner.shopName} is expiring soon!`,
          relatedEntity: {
            entityType: 'offer',
            entityId: offer._id,
          },
        })
      );

      await Promise.all(notifications);
    }
  } catch (error) {
    console.error('Error notifying about expiring offers:', error);
  }
};

/**
 * Notify all admins about a new member registration
 */
export const notifyAdminsMemberRegistered = async (member, user) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');

    const notifications = admins.map((admin) =>
      Notification.create({
        user: admin._id,
        type: 'member_registered',
        title: 'New Member Registration',
        message: `A new member ${member.firstName} ${member.lastName} (${user.email}) has registered.`,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying admins about member registration:', error);
  }
};

/**
 * Notify all admins about a new partner registration
 */
export const notifyAdminsPartnerRegistered = async (partner, user) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');

    const notifications = admins.map((admin) =>
      Notification.create({
        user: admin._id,
        type: 'partner_registered',
        title: 'New Partner Registration',
        message: `A new partner ${partner.partnerName} (${partner.shopName}) - ${user.email} has registered and is pending approval.`,
        relatedEntity: {
          entityType: 'partner',
          entityId: partner._id,
        },
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying admins about partner registration:', error);
  }
};

