import cron from 'node-cron';
import { checkExpiringOffers } from './expiringOffersScheduler.js';

let expiringOffersJob = null;

/**
 * Initialize and start the cron scheduler
 * This sets up a daily cron job to check for expiring offers
 */
export const startCronScheduler = () => {
  // Check if cron job is already running
  if (expiringOffersJob) {
    console.log('Cron scheduler is already running');
    return;
  }
  
  // Schedule: Daily at 9:00 AM (Asia/Colombo timezone)
  // Cron expression: '0 9 * * *' means:
  // - 0 minutes
  // - 9 hours (9 AM)
  // - * any day of month
  // - * any month
  // - * any day of week
  const cronExpression = '0 9 * * *'; // Daily at 9:00 AM
  
  console.log('Initializing cron scheduler for expiring offers...');
  console.log(`Schedule: Daily at 9:00 AM (${process.env.TZ || 'UTC'})`);
  
  expiringOffersJob = cron.schedule(
    cronExpression,
    async () => {
      console.log('\n[Cron Job] Running scheduled expiring offers check...');
      await checkExpiringOffers();
    },
    {
      scheduled: true,
      timezone: process.env.TZ || 'Asia/Colombo', // Default to Asia/Colombo, can be overridden via TZ env variable
    }
  );
  
  console.log('✓ Cron scheduler started successfully');
  console.log('  - Expiring offers check will run daily at 9:00 AM');
  console.log('  - Use POST /api/scheduler/expiring-offers to trigger manually\n');
};

/**
 * Stop the cron scheduler
 */
export const stopCronScheduler = () => {
  if (expiringOffersJob) {
    expiringOffersJob.stop();
    expiringOffersJob = null;
    console.log('Cron scheduler stopped');
  }
};

/**
 * Get the status of the cron scheduler
 */
export const getCronSchedulerStatus = () => {
  return {
    isRunning: !!expiringOffersJob,
    schedule: 'Daily at 9:00 AM',
    timezone: process.env.TZ || 'Asia/Colombo',
  };
};








