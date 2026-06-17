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

export { runPoller, checkHeartbeats, sweepAlerts, runAggregator };
