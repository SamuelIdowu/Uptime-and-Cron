import { db, monitors, monitorChecks, monitorDailyAggregates, heartbeatMonitors, heartbeatPings, heartbeatDailyAggregates } from "@steady-state/db";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function runAggregator(dateOverride?: Date) {
  const targetDate = dateOverride || subDays(new Date(), 1);
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  console.log(`[Aggregator] Calculating rollups for ${start.toISOString()} to ${end.toISOString()}`);

  try {
    // 1. Process HTTP Monitors (Grouped Aggregation)
    const httpStats = await db
      .select({
        monitorId: monitorChecks.monitorId,
        totalChecks: sql<number>`count(*)`,
        failedChecks: sql<number>`count(*) filter (where ${monitorChecks.status} = 'down')`,
        avgResponseMs: sql<number>`round(avg(${monitorChecks.responseMs}))`,
      })
      .from(monitorChecks)
      .where(and(gte(monitorChecks.createdAt, start), lt(monitorChecks.createdAt, end)))
      .groupBy(monitorChecks.monitorId);

    for (const stat of httpStats) {
      const uptimePercentage = (((stat.totalChecks - stat.failedChecks) / stat.totalChecks) * 100).toFixed(2);
      
      await db.insert(monitorDailyAggregates).values({
        monitorId: stat.monitorId,
        date: start,
        avgResponseMs: stat.avgResponseMs || 0,
        uptimePercentage,
        totalChecks: stat.totalChecks,
        failedChecks: stat.failedChecks,
      }).onConflictDoUpdate({
        target: [monitorDailyAggregates.monitorId, monitorDailyAggregates.date],
        set: {
          avgResponseMs: stat.avgResponseMs || 0,
          uptimePercentage,
          totalChecks: stat.totalChecks,
          failedChecks: stat.failedChecks,
          createdAt: new Date(),
        }
      });

      // Update Monitor-level Cache
      const last30Days = await db
        .select()
        .from(monitorDailyAggregates)
        .where(
          and(
            eq(monitorDailyAggregates.monitorId, stat.monitorId),
            gte(monitorDailyAggregates.date, subDays(new Date(), 30))
          )
        );

      if (last30Days.length > 0) {
        const uptime7d = last30Days
          .filter((d: any) => d.date >= subDays(new Date(), 7))
          .reduce((acc: number, d: any) => acc + parseFloat(d.uptimePercentage), 0) / Math.min(last30Days.length, 7);
        
        const uptime30d = last30Days
          .reduce((acc: number, d: any) => acc + parseFloat(d.uptimePercentage), 0) / last30Days.length;

        await db.update(monitors).set({
          uptime7d: uptime7d.toFixed(2),
          uptime30d: uptime30d.toFixed(2),
        }).where(eq(monitors.id, stat.monitorId));
      }
    }

    // 2. Process Heartbeats (Grouped Aggregation)
    const heartbeatStats = await db
      .select({
        heartbeatId: heartbeatPings.heartbeatId,
        totalPings: sql<number>`count(*)`,
      })
      .from(heartbeatPings)
      .where(and(gte(heartbeatPings.receivedAt, start), lt(heartbeatPings.receivedAt, end)))
      .groupBy(heartbeatPings.heartbeatId);

    for (const stat of heartbeatStats) {
      const uptimePercentage = stat.totalPings > 0 ? "100.00" : "0.00";

      await db.insert(heartbeatDailyAggregates).values({
        heartbeatId: stat.heartbeatId,
        date: start,
        uptimePercentage,
        totalPings: stat.totalPings,
      }).onConflictDoUpdate({
        target: [heartbeatDailyAggregates.heartbeatId, heartbeatDailyAggregates.date],
        set: {
          uptimePercentage,
          totalPings: stat.totalPings,
          createdAt: new Date(),
        }
      });

      // Update Heartbeat-level Cache
      const last30Days = await db
        .select()
        .from(heartbeatDailyAggregates)
        .where(
          and(
            eq(heartbeatDailyAggregates.heartbeatId, stat.heartbeatId),
            gte(heartbeatDailyAggregates.date, subDays(new Date(), 30))
          )
        );

      if (last30Days.length > 0) {
        const uptime7d = last30Days
          .filter((d: any) => d.date >= subDays(new Date(), 7))
          .reduce((acc: number, d: any) => acc + parseFloat(d.uptimePercentage), 0) / Math.min(last30Days.length, 7);
        
        const uptime30d = last30Days
          .reduce((acc: number, d: any) => acc + parseFloat(d.uptimePercentage), 0) / last30Days.length;

        await db.update(heartbeatMonitors).set({
          uptime7d: uptime7d.toFixed(2),
          uptime30d: uptime30d.toFixed(2),
        }).where(eq(heartbeatMonitors.id, stat.heartbeatId));
      }
    }

    console.log(`[Aggregator] Successfully processed rollups for ${httpStats.length} HTTP monitors and ${heartbeatStats.length} heartbeats.`);
  } catch (error) {
    console.error("[Aggregator] Critical error in aggregation task:", error);
  }
}
