import cron from 'node-cron';
import { sendDailyBookingReports } from './bookingReportController.js';

export const startDailyReportScheduler = () => {
  // Schedule to run every day at 06:00 AM (Indian Standard Time / Asia/Kolkata)
  // Format: second minute hour day-of-month month day-of-week
  // using node-cron standard format: minute hour day-of-month month day-of-week (5 fields)
  cron.schedule("0 6 * * *", async () => {
    console.log("⏰ Daily Cron Triggered: starting booking report dispatch at 06:00 AM IST...");
    try {
      await sendDailyBookingReports();
      console.log("✅ Daily Booking Reports cron completed successfully.");
    } catch (err) {
      console.error("❌ Daily Booking Reports cron encountered error:", err);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log("⏰ Booking Report daily scheduler initialized to run at 06:00 AM IST.");
};
