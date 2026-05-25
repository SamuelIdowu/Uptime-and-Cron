import "dotenv/config";
import cron from "node-cron";
import { runPoller } from "./poller.js";
import { checkHeartbeats } from "./heartbeat-checker.js";
import { sweepAlerts } from "./alert-sweeper.js";

console.log("Worker starting...");

// Tick every 60 seconds
cron.schedule("* * * * *", async () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Tick starting...`);

  try {
    // 1. Poll HTTP Monitors
    await runPoller();

    // 2. Check Heartbeat Timeouts
    await checkHeartbeats();

    // 3. Alert Retry Sweep
    await sweepAlerts();

    console.log(`[${now.toISOString()}] Tick completed.`);
  } catch (error) {
    console.error("Error in cron tick:", error);
  }
});

console.log("Worker scheduled.");
