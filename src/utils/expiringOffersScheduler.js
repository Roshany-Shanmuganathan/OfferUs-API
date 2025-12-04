import SavedOffer from '../models/SavedOffer.js';
import Offer from '../models/Offer.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Check if a notification was already sent today for this offer to this member
 * @param {string} userId - Member user ID
 * @param {string} offerId - Offer ID
 * @returns {Promise<boolean>} - True if notification was sent today
 */
const wasNotificationSentToday = async (userId, offerId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingNotification = await Notification.findOne({
      user: userId,
      type: 'expiring_offer',
      'relatedEntity.entityId': offerId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    return !!existingNotification;
  } catch (error) {
    console.error('Error checking notification:', error);
    return false; // If error, assume not sent to avoid duplicates
  }
};

/**
 * Calculate days until expiry
 * @param {Date} expiryDate - Offer expiry date
 * @returns {number} - Days until expiry
 */
const getDaysUntilExpiry = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get notification message based on days until expiry
 * @param {number} daysUntilExpiry - Days until offer expires
 * @param {string} offerTitle - Offer title
 * @param {string} partnerName - Partner shop name
 * @returns {string} - Notification message
 */
const getNotificationMessage = (daysUntilExpiry, offerTitle, partnerName) => {
  if (daysUntilExpiry === 0) {
    return `${offerTitle} from ${partnerName} expires today! Don't miss out!`;
  } else if (daysUntilExpiry === 1) {
    return `${offerTitle} from ${partnerName} expires tomorrow! Claim it now!`;
  } else {
    return `${offerTitle} from ${partnerName} expires in ${daysUntilExpiry} days. Don't miss this deal!`;
  }
};

/**
 * Main function to check and notify members about expiring saved offers
 * This function:
 * 1. Finds all members with saved offers
 * 2. Checks if any saved offer expires within the next 5 days
 * 3. Sends notifications (only once per day per offer)
 * 4. Runs daily until offer expires
 */
export const checkAndNotifyExpiringOffers = async () => {
  try {
    console.log('=== Starting Expiring Offers Check ===');
    const startTime = new Date();

    // Get all members who have saved offers
    const savedOffers = await SavedOffer.find()
      .populate({
        path: 'member',
        match: { role: 'member', isActive: true },
        select: '_id email',
      })
      .populate({
        path: 'offer',
        match: { isActive: true },
        select: '_id title expiryDate partner',
        populate: {
          path: 'partner',
          select: 'shopName partnerName',
        },
      });

    // Filter out null members/offers (from populate match)
    const validSavedOffers = savedOffers.filter(
      (savedOffer) => savedOffer.member && savedOffer.offer && savedOffer.offer.partner
    );

    console.log(`Found ${validSavedOffers.length} valid saved offers to check`);

    // Calculate date range (today to 5 days from now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);

    let notificationsCreated = 0;
    let notificationsSkipped = 0;
    let errors = 0;

    // Process each saved offer
    for (const savedOffer of validSavedOffers) {
      try {
        const offer = savedOffer.offer;
        const member = savedOffer.member;
        const expiryDate = new Date(offer.expiryDate);

        // Check if offer expires within the next 5 days
        if (expiryDate >= today && expiryDate <= fiveDaysFromNow) {
          // Check if notification was already sent today
          const alreadySent = await wasNotificationSentToday(member._id, offer._id);

          if (!alreadySent) {
            // Calculate days until expiry
            const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

            // Get partner name
            const partnerName = offer.partner.shopName || offer.partner.partnerName || 'Partner';

            // Create notification
            await Notification.create({
              user: member._id,
              type: 'expiring_offer',
              title: 'Offer Expiring Soon',
              message: getNotificationMessage(daysUntilExpiry, offer.title, partnerName),
              relatedEntity: {
                entityType: 'offer',
                entityId: offer._id,
              },
              isRead: false,
            });

            notificationsCreated++;
            console.log(
              `✓ Notification sent to ${member.email} for offer "${offer.title}" (expires in ${daysUntilExpiry} days)`
            );
          } else {
            notificationsSkipped++;
            console.log(
              `⊘ Notification already sent today to ${member.email} for offer "${offer.title}"`
            );
          }
        }
      } catch (error) {
        errors++;
        console.error(
          `Error processing saved offer ${savedOffer._id}:`,
          error.message
        );
      }
    }

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('=== Expiring Offers Check Completed ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Notifications created: ${notificationsCreated}`);
    console.log(`Notifications skipped (already sent today): ${notificationsSkipped}`);
    console.log(`Errors: ${errors}`);
    console.log('=======================================\n');
  } catch (error) {
    console.error('=== Error in checkAndNotifyExpiringOffers ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('==============================================\n');
  }
};

/**
 * Manual trigger function (for testing or manual execution)
 * Can be called from an API endpoint if needed
 */
export const triggerExpiringOffersCheck = async (req, res) => {
  try {
    console.log('Manual trigger of expiring offers check');
    await checkAndNotifyExpiringOffers();
    return res.status(200).json({
      success: true,
      message: 'Expiring offers check completed successfully',
    });
  } catch (error) {
    console.error('Error in manual trigger:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking expiring offers',
      error: error.message,
    });
  }
};

