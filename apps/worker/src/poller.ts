import { db, monitors, monitorEvents, Monitor } from "@steady-state/db";
import { eq, and, isNull, lte, or, sql } from "drizzle-orm";
import axios from "axios";
import pLimit from "p-limit";

const limit = pLimit(10); // Concurrency limit

export async function runPoller() {
  const now = new Date();
  console.log(`[Poller] Starting check at ${now.toISOString()}`);

  try {
    // 1. Fetch due monitors
    // We fetch monitors that are not paused and are due for a check
    const dueMonitors = await db
      .select()
      .from(monitors)
      .where(
        and(
          eq(monitors.paused, false),
          or(
            isNull(monitors.lastCheckedAt),
            sql`${monitors.lastCheckedAt} <= ${now} - (${monitors.intervalMinutes} * interval '1 minute')`
          )
        )
      );

    console.log(`[Poller] Found ${dueMonitors.length} monitors to check.`);

    const tasks = dueMonitors.map((monitor) =>
      limit(() => checkMonitor(monitor))
    );

    await Promise.all(tasks);
  } catch (error) {
    console.error("[Poller] Error in poller run:", error);
  }
}

async function checkMonitor(monitor: Monitor) {
  const start = Date.now();
  let currentStatus: "up" | "down" = "up";
  let httpStatus: number | null = null;
  let responseMs: number | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await axios.get(monitor.url, {
      timeout: 10000, // 10s timeout
      validateStatus: () => true, // Don't throw on error codes
    });

    httpStatus = response.status;
    responseMs = Date.now() - start;

    if (httpStatus !== monitor.expectedStatus) {
      currentStatus = "down";
      errorMessage = `Expected status ${monitor.expectedStatus}, got ${httpStatus}`;
    }
  } catch (error: any) {
    currentStatus = "down";
    errorMessage = error.message || "Unknown error";
    responseMs = Date.now() - start;
  }

  const statusChanged = monitor.status !== currentStatus;

  try {
    await db.transaction(async (tx) => {
      // 1. Update monitor record
      await tx
        .update(monitors)
        .set({
          status: currentStatus,
          lastCheckedAt: new Date(),
          avgResponseMs: responseMs, // Simple update for now, could be moving average later
          lastStatusChangeAt: statusChanged ? new Date() : monitor.lastStatusChangeAt,
        })
        .where(eq(monitors.id, monitor.id));

      // 2. If status changed, create event and trigger alert
      if (statusChanged) {
        console.log(
          `[Poller] Status changed for ${monitor.name}: ${monitor.status} -> ${currentStatus}`
        );

        await tx.insert(monitorEvents).values({
          monitorId: monitor.id,
          status: currentStatus,
          httpStatus,
          responseMs,
          errorMessage,
          startedAt: new Date(),
        });

        // 3. Trigger alert (Stub for now)
        await triggerAlert(monitor, currentStatus);
      }
    });
  } catch (error) {
    console.error(`[Poller] Failed to update monitor ${monitor.id}:`, error);
  }
}

async function triggerAlert(monitor: Monitor, status: "up" | "down") {
  console.log(`[Alert] ${monitor.name} is ${status.toUpperCase()}`);

  const apiUrl = process.env.WEB_API_URL || "http://localhost:3000";

  try {
    await axios.post(`${apiUrl}/api/internal/alert`, {
      monitorId: monitor.id,
      status,
    }, {
      headers: {
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      }
    });
  } catch (error) {
    console.error(`[Alert] Failed to trigger internal alert for ${monitor.id}:`, error);
  }
}
