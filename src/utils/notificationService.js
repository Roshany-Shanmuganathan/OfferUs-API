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
 * Notify partner about offer redemption
 */
export const notifyPartnerRedemption = async (offer, member) => {
  try {
    // Find partner user ID
    const Partner = (await import('../models/Partner.js')).default;
    const partner = await Partner.findById(offer.partner).select('userId shopName');
    
    if (!partner || !partner.userId) return;

    await Notification.create({
      user: partner.userId,
      type: 'system', // Using system type as per schema enum, or could add 'redemption' to enum if needed
      title: 'Offer Redeemed',
      message: `Your offer "${offer.title}" was redeemed by ${member.firstName} ${member.lastName}.`,
      relatedEntity: {
        entityType: 'offer',
        entityId: offer._id,
      },
    });
  } catch (error) {
    console.error('Error notifying partner about redemption:', error);
  }
};

/**
 * Notify members and partners about expiring offers
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
    }).populate('partner', 'shopName userId');

    for (const offer of expiringOffers) {
      // 1. Notify Members who saved this offer
      const SavedOffer = (await import('../models/SavedOffer.js')).default;
      const savedOffers = await SavedOffer.find({ offer: offer._id }).populate('member');

      const memberNotifications = savedOffers.map((savedOffer) =>
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

      // 2. Notify Partner
      if (offer.partner && offer.partner.userId) {
        const partnerNotification = Notification.create({
          user: offer.partner.userId,
          type: 'expiring_offer',
          title: 'Your Offer is Expiring Soon',
          message: `Your offer "${offer.title}" will expire in less than 24 hours.`,
          relatedEntity: {
            entityType: 'offer',
            entityId: offer._id,
          },
        });
        memberNotifications.push(partnerNotification);
      }

      await Promise.all(memberNotifications);
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

