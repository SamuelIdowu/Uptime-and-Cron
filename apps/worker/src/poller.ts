import { db, monitors, monitorEvents, monitorChecks, Monitor, dispatchAlerts } from "@steady-state/db";
import { eq, and, isNull, or, sql, desc } from "drizzle-orm";
import axios from "axios";
import pLimit from "p-limit";
import https from "https";
import { JSONPath } from 'jsonpath-plus';

const limit = pLimit(50); // Increased concurrency for IO-bound tasks

export async function runPoller() {
  const now = new Date();
  console.log(`[Poller] Starting check at ${now.toISOString()}`);

  try {
    // 1. Fetch due monitors
    const dueMonitors = await db
      .select()
      .from(monitors)
      .where(
        and(
          eq(monitors.paused, false),
          or(
            isNull(monitors.lastCheckedAt),
            sql`${monitors.lastCheckedAt} <= (now()::timestamp - (${monitors.intervalMinutes} * interval '1 minute'))`
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkMonitor(monitor: Monitor) {
  let attempts = 0;
  const maxAttempts = (monitor.autoRetry ?? 0) + 1;
  
  let lastResult: any = null;

  while (attempts < maxAttempts) {
    attempts++;
    const start = Date.now();
    let currentStatus: "up" | "down" = "up";
    let httpStatus: number | null = null;
    let responseMs: number | null = null;
    let errorMessage: string | null = null;
    let sslExpiryAt: Date | null = null;

    try {
      const agent = new https.Agent({
        rejectUnauthorized: monitor.sslPolicy === "strict" || monitor.sslPolicy === "standard",
      });

      const response = await axios.get(monitor.url, {
        timeout: 10000, // 10s timeout
        validateStatus: () => true, // Don't throw on error codes
        httpsAgent: agent,
      });

      const cert = response.request?.res?.socket?.getPeerCertificate?.();
      if (cert && cert.valid_to) {
        sslExpiryAt = new Date(cert.valid_to);
      }

      httpStatus = response.status;
      responseMs = Date.now() - start;

      if (httpStatus !== monitor.expectedStatus) {
        currentStatus = "down";
        errorMessage = `Expected status ${monitor.expectedStatus}, got ${httpStatus}`;
      }

      // SSL Expiry Check (within 7 days)
      if (currentStatus === "up" && sslExpiryAt) {
        const daysUntilExpiry = Math.ceil((sslExpiryAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7) {
          currentStatus = "down";
          errorMessage = `SSL Certificate expiring in ${daysUntilExpiry} days (${sslExpiryAt.toDateString()})`;
        }
      }

      // Check Assertions
      if (currentStatus === "up" && monitor.assertions) {
        try {
          const assertions = JSON.parse(monitor.assertions);
          const bodyStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          const bodyJson = typeof response.data === 'object' ? response.data : null;

          if (assertions.contains && !bodyStr.includes(assertions.contains)) {
            currentStatus = "down";
            errorMessage = `Response body did not contain: ${assertions.contains}`;
          }

          if (currentStatus === "up" && assertions.regex) {
            const re = new RegExp(assertions.regex);
            if (!re.test(bodyStr)) {
              currentStatus = "down";
              errorMessage = `Response body failed regex match: ${assertions.regex}`;
            }
          }

          if (currentStatus === "up" && assertions.jsonPath && bodyJson) {
            const result = JSONPath({ path: assertions.jsonPath, json: bodyJson });
            if (!result || result.length === 0) {
              currentStatus = "down";
              errorMessage = `JSON Path query failed: ${assertions.jsonPath}`;
            } else if (assertions.jsonPathValue !== undefined) {
              const value = Array.isArray(result) ? result[0] : result;
              if (value != assertions.jsonPathValue) {
                currentStatus = "down";
                errorMessage = `JSON Path value mismatch. Expected ${assertions.jsonPathValue}, got ${value}`;
              }
            }
          }
        } catch (e: any) {
           console.warn(`[Poller] Assertion error for ${monitor.name}:`, e.message);
        }
      }
    } catch (error: any) {
      currentStatus = "down";
      errorMessage = error.message || "Unknown error";
      responseMs = Date.now() - start;
    }

    lastResult = {
      currentStatus,
      httpStatus,
      responseMs,
      errorMessage,
      sslExpiryAt,
    };

    if (currentStatus === "up") {
      break;
    }

    if (attempts < maxAttempts) {
      console.log(`[Poller] Retrying ${monitor.name} (${attempts}/${maxAttempts-1})...`);
      await delay(2000);
    }
  }

  const { currentStatus, httpStatus, responseMs, errorMessage, sslExpiryAt } = lastResult;
  const statusChanged = monitor.status !== currentStatus;
  const newAvgMs = monitor.avgResponseMs && responseMs
    ? Math.round((monitor.avgResponseMs + responseMs) / 2)
    : responseMs;

  try {
    // 1. Record every check result
    await db.insert(monitorChecks).values({
      monitorId: monitor.id,
      status: currentStatus,
      httpStatus,
      responseMs,
      errorMessage,
    });

    // 2. Update monitor record
    await db
      .update(monitors)
      .set({
        status: currentStatus,
        lastCheckedAt: new Date(),
        avgResponseMs: newAvgMs,
        sslExpiryAt: sslExpiryAt,
        lastStatusChangeAt: statusChanged ? new Date() : monitor.lastStatusChangeAt,
      })
      .where(eq(monitors.id, monitor.id));

    // 3. If status changed, create event and trigger alert
    if (statusChanged) {
      console.log(
        `[Poller] Status changed for ${monitor.name}: ${monitor.status} -> ${currentStatus}`
      );

      // Close previous event if it exists (if we want interval-based events)
      // For now we just insert a new start event
      await db.insert(monitorEvents).values({
        monitorId: monitor.id,
        status: currentStatus,
        httpStatus,
        responseMs,
        errorMessage,
        startedAt: new Date(),
      });

      // 4. Trigger alert
      console.log(`[Alert] ${monitor.name} is ${currentStatus.toUpperCase()}`);
      await dispatchAlerts(monitor.id, null, currentStatus === "up" ? "recovered" : "down");
    }
  } catch (error) {
    console.error(`[Poller] Failed to update monitor ${monitor.id}:`, error);
  }
}
