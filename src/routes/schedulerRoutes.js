import express from 'express';
import { checkExpiringOffers } from '../utils/expiringOffersScheduler.js';
import { getCronSchedulerStatus } from '../utils/cronScheduler.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @desc    Manually trigger expiring offers check
 * @route   POST /api/scheduler/expiring-offers
 * @access  Private (Admin only)
 */
router.post('/expiring-offers', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    console.log('\n[Manual Trigger] Expiring offers check initiated by admin');
    const result = await checkExpiringOffers();
    
    if (result.success) {
      return sendSuccess(
        res,
        200,
        'Expiring offers check completed successfully',
        {
          notificationsCreated: result.notificationsCreated,
          notificationsSkipped: result.notificationsSkipped,
          errors: result.errors,
          duration: result.duration,
        }
      );
    } else {
      return sendError(
        res,
        500,
        `Expiring offers check failed: ${result.error}`,
        result
      );
    }
  } catch (error) {
    console.error('Error in manual expiring offers trigger:', error);
    return sendError(res, 500, error.message);
  }
});

/**
 * @desc    Get cron scheduler status
 * @route   GET /api/scheduler/status
 * @access  Private (Admin only)
 */
router.get('/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const status = getCronSchedulerStatus();
    return sendSuccess(res, 200, 'Scheduler status retrieved successfully', status);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
});

export default router;

