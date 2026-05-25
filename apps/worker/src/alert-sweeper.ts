import { db, alerts } from "@steady-state/db";
import { eq, and, lt } from "drizzle-orm";
import axios from "axios";

// Ideally, the worker should call the internal API for retries too,
// to keep integration logic centralized in the web app.
export async function sweepAlerts() {
    const now = new Date();
    console.log(`[AlertSweeper] Starting sweep at ${now.toISOString()}`);

    try {
        // Fetch alerts that failed and have less than 3 retries
        const failedAlerts = await db
            .select()
            .from(alerts)
            .where(
                and(
                    eq(alerts.status, "failed"),
                    lt(alerts.retryCount, 3)
                )
            );

        console.log(`[AlertSweeper] Found ${failedAlerts.length} alerts to retry.`);

        for (const alert of failedAlerts) {
            await retryAlert(alert);
        }
    } catch (error) {
        console.error("[AlertSweeper] Error in sweep:", error);
    }
}

async function retryAlert(alert: any) {
    console.log(`[AlertSweeper] Retrying alert ${alert.id} (Attempt ${alert.retryCount + 1})`);
    
    const apiUrl = process.env.WEB_API_URL || "http://localhost:3000";

    try {
        // We re-trigger the internal alert API. 
        // This is safe because the internal API fetches the latest settings and handles the logic.
        const res = await axios.post(`${apiUrl}/api/internal/alert`, {
            monitorId: alert.monitorId,
            heartbeatId: alert.heartbeatId,
            status: alert.type,
        }, {
            headers: {
                "x-internal-secret": process.env.INTERNAL_API_SECRET,
            }
        });

        if (res.status === 200) {
            await db.delete(alerts).where(eq(alerts.id, alert.id)); // Delete the old failed record on success
            console.log(`[AlertSweeper] Alert ${alert.id} retried successfully.`);
        }
    } catch (error) {
        console.error(`[AlertSweeper] Retry failed for alert ${alert.id}:`, error);
        await db
            .update(alerts)
            .set({
                retryCount: alert.retryCount + 1,
                error: JSON.stringify(error),
            })
            .where(eq(alerts.id, alert.id));
    }
}
