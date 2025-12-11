import SavedOffer from '../models/SavedOffer.js';
import Offer from '../models/Offer.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Calculate days until expiry
 * @param {Date} expiryDate - The expiry date of the offer
 * @returns {number} - Number of days until expiry (0 = today, 1 = tomorrow, etc.)
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
 * Generate notification message based on days until expiry
 * @param {number} daysUntilExpiry - Days until the offer expires
 * @param {string} offerTitle - Title of the offer
 * @returns {string} - Notification message
 */
const getNotificationMessage = (daysUntilExpiry, offerTitle) => {
  if (daysUntilExpiry === 0) {
    return `"${offerTitle}" expires today! Don't miss out!`;
  } else if (daysUntilExpiry === 1) {
    return `"${offerTitle}" expires tomorrow! Claim it now!`;
  } else {
    return `"${offerTitle}" expires in ${daysUntilExpiry} days. Don't miss this deal!`;
  }
};

/**
 * Check if notification was already sent today for this offer-member pair
 * @param {string} userId - User ID
 * @param {string} offerId - Offer ID
 * @returns {Promise<boolean>} - True if notification already sent today
 */
const isNotificationSentToday = async (userId, offerId) => {
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
};

/**
 * Main function to check and notify about expiring offers
 * This function:
 * 1. Finds all saved offers for all members
 * 2. Checks if any offer's expiry date is within the next 5 days
 * 3. Sends notifications to members for each such offer
 * 4. Ensures notifications are only sent once per day per offer
 */
export const checkExpiringOffers = async () => {
  const startTime = Date.now();
  console.log('\n=== Starting Expiring Offers Check ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  let notificationsCreated = 0;
  let notificationsSkipped = 0;
  let errors = 0;
  
  try {
    // Find all saved offers with populated member and offer data
    const savedOffers = await SavedOffer.find()
      .populate({
        path: 'member',
        select: '_id email role isActive',
      })
      .populate({
        path: 'offer',
        select: '_id title expiryDate isActive',
      });
    
    console.log(`Found ${savedOffers.length} saved offers to check`);
    
    // Process each saved offer
    for (const savedOffer of savedOffers) {
      try {
        // Skip if member or offer data is missing (populate failed)
        if (!savedOffer.member || !savedOffer.offer) {
          continue;
        }
        
        // Only process active members
        if (savedOffer.member.role !== 'member' || !savedOffer.member.isActive) {
          continue;
        }
        
        // Only process active offers
        if (!savedOffer.offer.isActive) {
          continue;
        }
        
        // Calculate days until expiry
        const daysUntilExpiry = getDaysUntilExpiry(savedOffer.offer.expiryDate);
        
        // Check if offer expires within the next 5 days (including today)
        if (daysUntilExpiry < 0) {
          // Offer already expired, skip
          continue;
        }
        
        if (daysUntilExpiry > 5) {
          // Offer expires more than 5 days away, skip
          continue;
        }
        
        // Check if notification was already sent today
        const alreadySent = await isNotificationSentToday(
          savedOffer.member._id,
          savedOffer.offer._id
        );
        
        if (alreadySent) {
          notificationsSkipped++;
          console.log(
            `⊘ Notification already sent today to ${savedOffer.member.email} for offer "${savedOffer.offer.title}"`
          );
          continue;
        }
        
        // Create notification
        const message = getNotificationMessage(
          daysUntilExpiry,
          savedOffer.offer.title
        );
        
        await Notification.create({
          user: savedOffer.member._id,
          type: 'expiring_offer',
          title: 'Offer Expiring Soon',
          message: message,
          relatedEntity: {
            entityType: 'offer',
            entityId: savedOffer.offer._id,
          },
          isRead: false,
        });
        
        notificationsCreated++;
        console.log(
          `✓ Notification sent to ${savedOffer.member.email} for offer "${savedOffer.offer.title}" (expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''})`
        );
      } catch (error) {
        errors++;
        console.error(
          `Error processing saved offer ${savedOffer._id}:`,
          error.message
        );
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('=== Expiring Offers Check Completed ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Notifications created: ${notificationsCreated}`);
    console.log(`Notifications skipped (already sent today): ${notificationsSkipped}`);
    console.log(`Errors: ${errors}`);
    console.log('=======================================\n');
    
    return {
      success: true,
      notificationsCreated,
      notificationsSkipped,
      errors,
      duration: parseFloat(duration),
    };
  } catch (error) {
    console.error('Fatal error in expiring offers check:', error);
    return {
      success: false,
      error: error.message,
      notificationsCreated,
      notificationsSkipped,
      errors: errors + 1,
    };
  }
};






