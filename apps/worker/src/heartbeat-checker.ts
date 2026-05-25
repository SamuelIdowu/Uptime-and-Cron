import { db, heartbeatMonitors, dispatchAlerts } from "@steady-state/db";
import { eq, and, isNull, or, sql } from "drizzle-orm";

export async function checkHeartbeats() {
  const now = new Date();
  console.log(`[Heartbeat] Starting check at ${now.toISOString()}`);

  try {
    // Fetch monitors that are not paused and might be late or down
    // We check anything that hasn't pinged within its period
    const actionableMonitors = await db
      .select()
      .from(heartbeatMonitors)
      .where(
        and(
          eq(heartbeatMonitors.paused, false),
          or(
            isNull(heartbeatMonitors.lastPingAt),
            sql`${heartbeatMonitors.lastPingAt} <= (now()::timestamp - (${heartbeatMonitors.periodMinutes} * interval '1 minute') + interval '50 seconds')`
          )
        )
      );

    console.log(`[Heartbeat] Found ${actionableMonitors.length} actionable heartbeats.`);

    for (const monitor of actionableMonitors) {
      const lastPingOrCreated = monitor.lastPingAt ? new Date(monitor.lastPingAt) : new Date(monitor.createdAt);
      const diffMs = now.getTime() - lastPingOrCreated.getTime();
      const periodMs = monitor.periodMinutes * 60 * 1000;
      const graceMs = monitor.graceMinutes * 60 * 1000;

      let newStatus: "up" | "late" | "down" = monitor.status;

      if (diffMs >= (periodMs + graceMs)) {
        newStatus = "down";
      } else if (diffMs >= periodMs) {
        newStatus = "late";
      } else {
        newStatus = "up";
      }

      if (newStatus !== monitor.status) {
        console.log(`[Heartbeat] Status change for ${monitor.name}: ${monitor.status} -> ${newStatus}`);
        
        await db
          .update(heartbeatMonitors)
          .set({ status: newStatus })
          .where(eq(heartbeatMonitors.id, monitor.id));

        // Alert only on DOWN
        if (newStatus === "down") {
          await dispatchAlerts(null, monitor.id, "down");
        } else if (newStatus === "late" && monitor.status !== "down") {
          // Optional: alert on late
          await dispatchAlerts(null, monitor.id, "late");
        }
      }
    }
  } catch (error) {
    console.error("[Heartbeat] Error in heartbeat check:", error);
  }
}
