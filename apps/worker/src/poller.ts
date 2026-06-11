import { db, monitors, monitorEvents, monitorChecks, Monitor, dispatchAlerts, maintenanceWindows } from "@steady-state/db";
import { eq, and, isNull, or, sql, desc, lte, gte } from "drizzle-orm";
import axios from "axios";
import pLimit from "p-limit";
import https from "https";
import { JSONPath } from 'jsonpath-plus';

const limit = pLimit(50); // Increased concurrency for IO-bound tasks
const targetLimit = pLimit(10); // Concurrency for individual targets

export async function runPoller() {
  const now = new Date();
  console.log(`[Poller] Starting check at ${now.toISOString()}`);

  try {
    // 0. Fetch active maintenance windows
    const activeWindows = await db.query.maintenanceWindows.findMany({
        where: and(
            lte(maintenanceWindows.startTime, now),
            gte(maintenanceWindows.endTime, now)
        )
    });

    const globalUserIds = new Set(activeWindows.filter(w => !w.monitorId && !w.heartbeatId).map(w => w.userId));
    const monitorIdsInMaintenance = new Set(activeWindows.filter(w => w.monitorId).map(w => w.monitorId));

    // 1. Fetch due monitors with targets
    const dueMonitors = await db.query.monitors.findMany({
      where: and(
        eq(monitors.paused, false),
        or(
          isNull(monitors.lastCheckedAt),
          sql`${monitors.lastCheckedAt} <= (now()::timestamp - (${monitors.intervalMinutes} * interval '1 minute') + interval '50 seconds')`
        )
      ),
      with: {
        targets: true,
      },
    });

    // 2. Filter out monitors in maintenance
    const filteredMonitors = dueMonitors.filter(m => {
        if (globalUserIds.has(m.userId)) return false;
        if (monitorIdsInMaintenance.has(m.id)) return false;
        return true;
    });

    console.log(`[Poller] Found ${dueMonitors.length} monitors (${filteredMonitors.length} after maintenance filter).`);

    const tasks = filteredMonitors.map((monitor) =>
      limit(() => checkMonitor(monitor as any))
    );

    await Promise.all(tasks);
  } catch (error) {
    console.error("[Poller] Error in poller run:", error);
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function performCheckOnTarget(url: string, monitor: Monitor) {
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

    const response = await axios.get(url, {
      timeout: 10000, // 10s timeout
      validateStatus: () => true, // Don't throw on error codes
      httpsAgent: agent,
      headers: {
        'User-Agent': 'SteadyStateBot/1.0 (+https://steadystate.dev)',
      }
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
         console.warn(`[Poller] Assertion error for target ${url} on ${monitor.name}:`, e.message);
      }
    }
  } catch (error: any) {
    currentStatus = "down";
    errorMessage = error.message || "Unknown error";
    responseMs = Date.now() - start;
  }

  return { url, currentStatus, httpStatus, responseMs, errorMessage, sslExpiryAt };
}

async function checkMonitor(monitor: Monitor & { targets?: { url: string }[] }) {
  let attempts = 0;
  const maxAttempts = (monitor.autoRetry ?? 0) + 1;
  
  const targetUrls = monitor.targets && monitor.targets.length > 0
    ? monitor.targets.map(t => t.url)
    : (monitor.url ? [monitor.url] : []);

  if (targetUrls.length === 0) {
    console.warn(`[Poller] Monitor ${monitor.name} (${monitor.id}) has no targets configured.`);
    return;
  }

  let finalResult: any = null;

  while (attempts < maxAttempts) {
    attempts++;
    
    // Concurrent check across all targets
    const targetChecks = targetUrls.map(url => targetLimit(() => performCheckOnTarget(url, monitor)));
    const results = await Promise.all(targetChecks);

    // Consensus Logic
    const upTargets = results.filter(r => r.currentStatus === "up");
    const downTargets = results.filter(r => r.currentStatus === "down");
    
    let consensusUp = false;
    const threshold = monitor.healthThreshold || "any";

    if (threshold === "any") {
      consensusUp = upTargets.length > 0;
    } else if (threshold === "all") {
      consensusUp = upTargets.length === results.length;
    } else if (threshold === "quorum") {
      consensusUp = upTargets.length > results.length / 2;
    }

    const currentStatus: "up" | "down" = consensusUp ? "up" : "down";

    // Aggregated data
    const healthyResults = upTargets.length > 0 ? upTargets : results;
    const avgResponseMs = Math.round(healthyResults.reduce((acc, r) => acc + (r.responseMs || 0), 0) / healthyResults.length);
    const primaryHttpStatus = results[0].httpStatus; // Use the first target's status as representative
    
    let errorMessage: string | null = null;
    if (currentStatus === "down") {
      errorMessage = downTargets.length > 0 
        ? downTargets.map(t => `${t.url}: ${t.errorMessage}`).join(" | ")
        : "Consensus threshold not met";
    }

    // Collect latest SSL expiry from any target that has it
    const sslExpiryAt = results.reduce((latest, r) => {
      if (r.sslExpiryAt && (!latest || r.sslExpiryAt < latest)) return r.sslExpiryAt;
      return latest;
    }, null as Date | null);

    finalResult = {
      currentStatus,
      httpStatus: primaryHttpStatus,
      responseMs: avgResponseMs,
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

  const { currentStatus, httpStatus, responseMs, errorMessage, sslExpiryAt } = finalResult;
  const statusChanged = monitor.status !== currentStatus;
  const newAvgMs = monitor.avgResponseMs && responseMs
    ? Math.round((monitor.avgResponseMs + responseMs) / 2)
    : responseMs;

  try {
    // 1. Record aggregated check result
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
