import { db, alerts, alertSettings, monitors, heartbeatMonitors } from "@steady-state/db";
import { eq, and, lt, or, inArray } from "drizzle-orm";
import { sendAlertEmail, sendSlackAlert, sendTelegramAlert } from "@steady-state/notifications";

export async function sweepAlerts() {
    const now = new Date();
    console.log(`[AlertSweeper] Starting sweep at ${now.toISOString()}`);

    try {
        // Fetch alerts that are either pending or failed with less than 3 retries
        const alertsToProcess = await db
            .select()
            .from(alerts)
            .where(
                or(
                    eq(alerts.status, "pending"),
                    and(
                        eq(alerts.status, "failed"),
                        lt(alerts.retryCount, 3)
                    )
                )
            );

        if (alertsToProcess.length === 0) {
            console.log(`[AlertSweeper] No alerts to process.`);
            return;
        }

        console.log(`[AlertSweeper] Found ${alertsToProcess.length} alerts to process.`);

        for (const alert of alertsToProcess) {
            await processAlert(alert);
        }
    } catch (error) {
        console.error("[AlertSweeper] Error in sweep:", error);
    }
}

async function processAlert(alert: any) {
    console.log(`[AlertSweeper] Processing alert ${alert.id} (${alert.channel}) - Attempt ${alert.retryCount + 1}`);
    
    try {
        const settings = await db.query.alertSettings.findFirst({
            where: eq(alertSettings.userId, alert.userId)
        });

        if (!settings) {
            console.error(`[AlertSweeper] Settings not found for user ${alert.userId}. Marking alert as dead.`);
            await db.update(alerts).set({ status: "dead", error: "Settings not found" }).where(eq(alerts.id, alert.id));
            return;
        }

        let name = "Unknown Monitor";
        let url = undefined;

        if (alert.monitorId) {
            const m = await db.query.monitors.findFirst({ where: eq(monitors.id, alert.monitorId) });
            if (m) {
                name = m.name;
                url = m.url;
            }
        } else if (alert.heartbeatId) {
            const h = await db.query.heartbeatMonitors.findFirst({ where: eq(heartbeatMonitors.id, alert.heartbeatId) });
            if (h) name = h.name;
        }

        let res: { success: boolean; error?: any } = { success: false, error: "Unsupported channel" };

        if (alert.channel === "email" && settings.email) {
            res = await sendAlertEmail(settings.email, name, alert.type, url);
        } else if (alert.channel === "slack" && settings.slackWebhookUrl) {
            res = await sendSlackAlert(settings.slackWebhookUrl, name, alert.type, url);
        } else if (alert.channel === "telegram" && settings.telegramBotToken && settings.telegramChatId) {
            res = await sendTelegramAlert(settings.telegramBotToken, settings.telegramChatId, name, alert.type, url);
        }

        if (res.success) {
            await db.update(alerts).set({
                status: "sent",
                sentAt: new Date(),
                error: null,
            }).where(eq(alerts.id, alert.id));
            console.log(`[AlertSweeper] Alert ${alert.id} dispatched successfully.`);
        } else {
            throw res.error || new Error(res.error || "Unknown dispatch error");
        }
    } catch (error: any) {
        const isDead = alert.retryCount >= 2; // 0, 1, 2 = 3 attempts
        console.error(`[AlertSweeper] Dispatch failed for alert ${alert.id}:`, error);
        
        await db
            .update(alerts)
            .set({
                status: isDead ? "dead" : "failed",
                retryCount: alert.retryCount + 1,
                error: error instanceof Error ? error.message : JSON.stringify(error),
            })
            .where(eq(alerts.id, alert.id));
            
        if (isDead) console.warn(`[AlertSweeper] Alert ${alert.id} reached max retries and is now DEAD.`);
    }
}
