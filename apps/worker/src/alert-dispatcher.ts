import { db, monitors, heartbeatMonitors, alertSettings, alerts } from "@steady-state/db";
import { eq } from "drizzle-orm";

export async function dispatchAlerts(
  monitorId: string | null,
  heartbeatId: string | null,
  status: "up" | "down" | "late" | "recovered"
) {
  try {
    let userId: string | null = null;

    if (monitorId) {
      const monitor = await db.query.monitors.findFirst({
        where: eq(monitors.id, monitorId),
      });
      if (monitor) userId = monitor.userId;
    } else if (heartbeatId) {
      const heartbeat = await db.query.heartbeatMonitors.findFirst({
        where: eq(heartbeatMonitors.id, heartbeatId),
      });
      if (heartbeat) userId = heartbeat.userId;
    }

    if (!userId) {
      console.warn(`[AlertDispatcher] Monitor or Heartbeat not found`);
      return;
    }

    const settings = await db.query.alertSettings.findFirst({
      where: eq(alertSettings.userId, userId),
    });

    if (!settings) {
      console.log(`[AlertDispatcher] Alert settings not found for user ${userId}`);
      return;
    }

    const pendingAlerts = [];

    // 1. Email Alert
    if (settings.email) {
      pendingAlerts.push({
        userId,
        monitorId,
        heartbeatId,
        type: status,
        channel: "email" as const,
        status: "pending" as const,
      });
    }

    // 2. Slack Alert
    if (settings.slackWebhookUrl) {
      pendingAlerts.push({
        userId,
        monitorId,
        heartbeatId,
        type: status,
        channel: "slack" as const,
        status: "pending" as const,
      });
    }

    // 3. Telegram Alert
    if (settings.telegramChatId && settings.telegramBotToken) {
      pendingAlerts.push({
        userId,
        monitorId,
        heartbeatId,
        type: status,
        channel: "telegram" as const,
        status: "pending" as const,
      });
    }

    if (pendingAlerts.length > 0) {
      await db.insert(alerts).values(pendingAlerts);
      console.log(`[AlertDispatcher] Created ${pendingAlerts.length} pending alerts in outbox.`);
    }
  } catch (error) {
    console.error("[AlertDispatcher] Error queuing alerts:", error);
  }
}
