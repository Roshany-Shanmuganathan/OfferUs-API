import cron from 'node-cron';
import { checkAndNotifyExpiringOffers } from './expiringOffersScheduler.js';

/**
 * Initialize and start all cron jobs
 * This function sets up scheduled tasks that run automatically
 */
export const initializeCronJobs = () => {
  console.log('=== Initializing Cron Jobs ===');

  // Schedule: Run daily at 9:00 AM (adjust timezone as needed)
  // Cron format: minute hour day month day-of-week
  // '0 9 * * *' = Every day at 9:00 AM
  // '0 */6 * * *' = Every 6 hours (for testing)
  // '*/5 * * * *' = Every 5 minutes (for testing)

  // Daily check for expiring offers at 9:00 AM
  const expiringOffersJob = cron.schedule('0 9 * * *', async () => {
    console.log('\n[Cron Job] Running daily expiring offers check...');
    await checkAndNotifyExpiringOffers();
  }, {
    scheduled: true,
    timezone: 'Asia/Colombo', // Adjust to your timezone
  });

  console.log('✓ Expiring offers check scheduled: Daily at 9:00 AM');
  console.log('=== Cron Jobs Initialized ===\n');

  return {
    expiringOffersJob,
  };
};

/**
 * Start cron jobs (call this after database connection)
 */
export const startCronJobs = () => {
  try {
    const jobs = initializeCronJobs();
    console.log('All cron jobs started successfully');
    return jobs;
  } catch (error) {
    console.error('Error starting cron jobs:', error);
    throw error;
  }
};

/**
 * Stop all cron jobs (useful for graceful shutdown)
 */
export const stopCronJobs = (jobs) => {
  try {
    if (jobs && jobs.expiringOffersJob) {
      jobs.expiringOffersJob.stop();
      console.log('Cron jobs stopped');
    }
  } catch (error) {
    console.error('Error stopping cron jobs:', error);
  }
};

