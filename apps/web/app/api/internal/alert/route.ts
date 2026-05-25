import { NextResponse } from "next/server";
import { db, monitors, heartbeatMonitors, alertSettings, alerts } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { sendAlertEmail } from "@/lib/resend";
import { sendSlackAlert } from "@/lib/slack";

export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");

  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { monitorId, heartbeatId, status } = body;

    let userId: string | null = null;
    let name: string = "";
    let url: string | undefined = undefined;

    if (monitorId) {
      const monitor = await db.query.monitors.findFirst({
        where: eq(monitors.id, monitorId),
      });
      if (monitor) {
        userId = monitor.userId;
        name = monitor.name;
        url = monitor.url;
      }
    } else if (heartbeatId) {
      const heartbeat = await db.query.heartbeatMonitors.findFirst({
        where: eq(heartbeatMonitors.id, heartbeatId),
      });
      if (heartbeat) {
        userId = heartbeat.userId;
        name = heartbeat.name;
      }
    }

    if (!userId) {
      return new NextResponse("Monitor or Heartbeat not found", { status: 404 });
    }

    const settings = await db.query.alertSettings.findFirst({
      where: eq(alertSettings.userId, userId),
    });

    if (!settings) {
      return new NextResponse("Alert settings not found", { status: 404 });
    }

    const promises: Promise<any>[] = [];

    // 1. Email Alert
    if (settings.email) {
      promises.push(
        sendAlertEmail(settings.email, name, status, url).then(async (res) => {
          await db.insert(alerts).values({
            userId: userId!,
            monitorId,
            heartbeatId,
            type: status,
            channel: "email",
            status: res.success ? "sent" : "failed",
            error: res.success ? null : JSON.stringify(res.error),
            sentAt: res.success ? new Date() : null,
          });
        })
      );
    }

    // 2. Slack Alert
    if (settings.slackWebhookUrl) {
      promises.push(
        sendSlackAlert(settings.slackWebhookUrl, name, status, url).then(async (res) => {
          await db.insert(alerts).values({
            userId: userId!,
            monitorId,
            heartbeatId,
            type: status,
            channel: "slack",
            status: res.success ? "sent" : "failed",
            error: res.success ? null : JSON.stringify(res.error),
            sentAt: res.success ? new Date() : null,
          });
        })
      );
    }

    await Promise.all(promises);

    return new NextResponse("Alerts dispatched", { status: 200 });
  } catch (error) {
    console.error("[INTERNAL_ALERT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
