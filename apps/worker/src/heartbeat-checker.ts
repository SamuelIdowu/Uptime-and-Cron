import { db, heartbeatMonitors } from "@steady-state/db";
import { eq, and, isNull, lte, or, sql } from "drizzle-orm";
import axios from "axios";

export async function checkHeartbeats() {
  const now = new Date();
  console.log(`[Heartbeat] Starting check at ${now.toISOString()}`);

  try {
    // Fetch monitors that are not paused and are overdue
    // Overdue = lastPingAt < now - (periodMinutes + graceMinutes)
    const overdueMonitors = await db
      .select()
      .from(heartbeatMonitors)
      .where(
        and(
          eq(heartbeatMonitors.paused, false),
          or(
            // If never pinged and created more than period+grace ago
            and(
              isNull(heartbeatMonitors.lastPingAt),
              sql`${heartbeatMonitors.createdAt} <= ${now} - ((${heartbeatMonitors.periodMinutes} + ${heartbeatMonitors.graceMinutes}) * interval '1 minute')`
            ),
            // If pinged before but overdue now
            sql`${heartbeatMonitors.lastPingAt} <= ${now} - ((${heartbeatMonitors.periodMinutes} + ${heartbeatMonitors.graceMinutes}) * interval '1 minute')`
          )
        )
      );

    console.log(`[Heartbeat] Found ${overdueMonitors.length} overdue heartbeats.`);

    for (const monitor of overdueMonitors) {
      if (monitor.status === "up" || monitor.status === "pending") {
        await handleHeartbeatTimeout(monitor);
      }
    }
  } catch (error) {
    console.error("[Heartbeat] Error in heartbeat check:", error);
  }
}

async function handleHeartbeatTimeout(monitor: any) {
  const newStatus = "down"; // Or "late" if we want to distinguish

  console.log(`[Heartbeat] Timeout for ${monitor.name}. Changing status to ${newStatus}`);

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(heartbeatMonitors)
        .set({
          status: newStatus,
        })
        .where(eq(heartbeatMonitors.id, monitor.id));

      // Trigger alert
      await triggerAlert(monitor, newStatus);
    });
  } catch (error) {
    console.error(`[Heartbeat] Failed to update heartbeat ${monitor.id}:`, error);
  }
}

async function triggerAlert(monitor: any, status: string) {
  const apiUrl = process.env.WEB_API_URL || "http://localhost:3000";

  try {
    await axios.post(`${apiUrl}/api/internal/alert`, {
      heartbeatId: monitor.id,
      status,
    }, {
      headers: {
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      }
    });
  } catch (error) {
    console.error(`[Heartbeat Alert] Failed to trigger internal alert for ${monitor.id}:`, error);
  }
}
