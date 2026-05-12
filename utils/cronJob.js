import cron from "cron";

// Runs every minute
export const startCronJob = () => {
  const job = new cron.CronJob("* * * * *", () => {
    console.log("⏰ Cron job executed at", new Date().toLocaleString());
    // Add scheduled task logic here
  });

  job.start();
  console.log("✅ Cron job scheduled to run every minute");
};
