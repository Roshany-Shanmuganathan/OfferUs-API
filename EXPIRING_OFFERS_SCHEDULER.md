# Expiring Offers Notification Scheduler

This document describes the daily cron job system that notifies members about their saved offers that are expiring within the next 5 days.

## Overview

The system automatically checks all saved offers daily and sends notifications to members whose saved offers expire within the next 5 days. Notifications are sent only once per day per offer to avoid spam.

## Files Created

1. **`api/src/utils/expiringOffersScheduler.js`** - Main logic for checking and notifying about expiring offers
2. **`api/src/utils/cronScheduler.js`** - Cron job initialization and management
3. **`api/src/routes/schedulerRoutes.js`** - API endpoint for manual triggering (admin only)

## Features

- ✅ Daily automatic check at 9:00 AM (configurable)
- ✅ Checks all members with saved offers
- ✅ Identifies offers expiring within 5 days
- ✅ Prevents duplicate notifications (only once per day per offer)
- ✅ Detailed logging for monitoring
- ✅ Manual trigger endpoint for testing
- ✅ Error handling and graceful failures

## Installation

1. Install the required dependency:
```bash
cd api
npm install node-cron
```

2. The cron job will automatically start when the server starts (after database connection).

## Configuration

### Schedule Time

The default schedule is set to run daily at 9:00 AM (Asia/Colombo timezone). To change this, edit `api/src/utils/cronScheduler.js`:

```javascript
// Current: Daily at 9:00 AM
cron.schedule('0 9 * * *', ...)

// Examples:
// Every 6 hours: '0 */6 * * *'
// Every day at midnight: '0 0 * * *'
// Every day at 6 PM: '0 18 * * *'
```

### Timezone

Change the timezone in `cronScheduler.js`:
```javascript
timezone: 'Asia/Colombo', // Change to your timezone
```

## How It Works

1. **Daily Execution**: The cron job runs automatically at the scheduled time
2. **Find Saved Offers**: Queries all `SavedOffer` documents with populated member and offer data
3. **Filter Active**: Only processes active members and active offers
4. **Check Expiry**: Calculates if offer expires within 5 days from today
5. **Check Duplicates**: Verifies if notification was already sent today for this offer-member pair
6. **Create Notification**: Creates a notification record in the database
7. **Logging**: Logs all actions for monitoring and debugging

## Notification Messages

The notification message varies based on days until expiry:
- **Today**: "Offer expires today! Don't miss out!"
- **Tomorrow**: "Offer expires tomorrow! Claim it now!"
- **2-5 days**: "Offer expires in X days. Don't miss this deal!"

## Manual Trigger (Testing)

For testing purposes, you can manually trigger the check via API:

```bash
POST /api/scheduler/expiring-offers
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Expiring offers check completed successfully"
}
```

## Database Structure

The system uses existing collections:

- **SavedOffer**: Links members to saved offers
  ```javascript
  {
    member: ObjectId, // Reference to User
    offer: ObjectId,  // Reference to Offer
    createdAt: Date,
    updatedAt: Date
  }
  ```

- **Offer**: Contains offer details including expiry date
  ```javascript
  {
    _id: ObjectId,
    title: String,
    expiryDate: Date,
    isActive: Boolean,
    partner: ObjectId // Reference to Partner
  }
  ```

- **Notification**: Stores notifications sent to users
  ```javascript
  {
    user: ObjectId,
    type: 'expiring_offer',
    title: String,
    message: String,
    relatedEntity: {
      entityType: 'offer',
      entityId: ObjectId
    },
    isRead: Boolean,
    createdAt: Date
  }
  ```

## Duplicate Prevention

The system prevents duplicate notifications by checking if a notification with:
- Same `user`
- Same `type` ('expiring_offer')
- Same `relatedEntity.entityId` (offer ID)
- Created today (between midnight and 11:59 PM)

already exists in the database.

## Logging

The scheduler provides detailed console logs:

```
=== Starting Expiring Offers Check ===
Found 150 valid saved offers to check
✓ Notification sent to user@example.com for offer "50% Off" (expires in 3 days)
⊘ Notification already sent today to user@example.com for offer "Free Shipping"
=== Expiring Offers Check Completed ===
Duration: 2.45s
Notifications created: 45
Notifications skipped (already sent today): 12
Errors: 0
=======================================
```

## Error Handling

- Individual offer processing errors are caught and logged without stopping the entire process
- Database connection errors are handled gracefully
- Failed notifications are logged but don't prevent other notifications from being sent

## Monitoring

Monitor the cron job by checking:
1. Server logs for daily execution reports
2. Notification collection for new notifications created
3. Error logs for any issues

## Troubleshooting

### Cron job not running
- Check server logs for initialization messages
- Verify database connection is established
- Check timezone configuration

### Notifications not being created
- Verify offers have valid `expiryDate`
- Check that offers are `isActive: true`
- Ensure members are `isActive: true` and `role: 'member'`
- Check for errors in logs

### Too many notifications
- Verify duplicate prevention logic is working
- Check notification creation timestamps
- Review cron schedule to ensure it's not running too frequently

## Production Considerations

1. **Server Restarts**: The cron job will restart automatically when the server restarts
2. **Multiple Instances**: If running multiple server instances, ensure only one runs the cron job (consider using a distributed lock)
3. **Performance**: For large datasets, consider batching or pagination
4. **Monitoring**: Set up alerts for cron job failures
5. **Backup**: Ensure database backups include the Notification collection

## Future Enhancements

Possible improvements:
- Email notifications in addition to in-app notifications
- SMS notifications for critical expiring offers
- Configurable notification days (currently hardcoded to 5)
- User preferences for notification frequency
- Batch processing for large member bases
- Retry mechanism for failed notifications

