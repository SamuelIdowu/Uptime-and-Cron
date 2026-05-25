import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from the project root if it exists
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Then try to load from the worker's own directory (overrides root if both exist)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import cron from "node-cron";
import { runPoller } from "./poller.js";
import { checkHeartbeats } from "./heartbeat-checker.js";
import { sweepAlerts } from "./alert-sweeper.js";
import { runAggregator } from "./aggregator.js";

// Global Error Handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Worker] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Worker] Uncaught Exception:", error);
  // Optional: Graceful shutdown logic here if needed
});

console.log("Worker starting...");

let isRunning = false;

// Daily Rollup at 00:05 UTC
cron.schedule("5 0 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Running daily rollups...`);
  try {
    await runAggregator();
    console.log(`[${new Date().toISOString()}] Daily rollups completed.`);
  } catch (error) {
    console.error("Error in daily rollup:", error);
  }
});

// Tick every 60 seconds
cron.schedule("* * * * *", async () => {
  if (isRunning) {
    console.log(`[${new Date().toISOString()}] Previous tick is still running. Skipping...`);
    return;
  }
  
  isRunning = true;
  const now = new Date();
  console.log(`[${now.toISOString()}] Tick starting...`);

  try {
    // 1. Poll HTTP Monitors
    await runPoller();

    // 2. Check Heartbeat Timeouts
    await checkHeartbeats();

    // 3. Alert Retry Sweep
    await sweepAlerts();

    console.log(`[${new Date().toISOString()}] Tick completed.`);
  } catch (error) {
    console.error("Error in cron tick:", error);
  } finally {
    isRunning = false;
  }
});

console.log("Worker scheduled.");
