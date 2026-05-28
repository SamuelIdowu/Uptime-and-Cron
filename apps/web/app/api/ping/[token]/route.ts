import { db, heartbeatMonitors, heartbeatPings, dispatchAlerts } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Simple in-memory rate limiting (works per-instance)
// NOTE: For production on Vercel, @upstash/ratelimit is recommended
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // Max 30 pings per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.lastReset = now;
    rateLimitMap.set(ip, userData);
    return false;
  }

  userData.count++;
  rateLimitMap.set(ip, userData);
  return userData.count > MAX_REQUESTS;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const headerPayload = await headers();
    const ip = headerPayload.get("x-forwarded-for") || "unknown";

    if (checkRateLimit(ip)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    const { token } = await params;
    const heartbeat = await db.query.heartbeatMonitors.findFirst({
      where: eq(heartbeatMonitors.pingToken, token),
    });

    if (!heartbeat) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (heartbeat.paused) {
      return new NextResponse("Heartbeat is paused", { status: 200 });
    }

    const isRecovering = heartbeat.status === "down" || heartbeat.status === "late";

    // 1. Record the ping
    await db.insert(heartbeatPings).values({
      heartbeatId: heartbeat.id,
      sourceIp: ip,
    });

    // 2. Update the last ping time and status
    await db
      .update(heartbeatMonitors)
      .set({
        lastPingAt: new Date(),
        status: "up", // Reset to UP when a ping is received
      })
      .where(eq(heartbeatMonitors.id, heartbeat.id));

    // 3. Dispatch recovery alert if needed
    if (isRecovering) {
      await dispatchAlerts(null, heartbeat.id, "recovered");
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const headerPayload = await headers();
    const ip = headerPayload.get("x-forwarded-for") || "unknown";

    if (checkRateLimit(ip)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    const { token } = await params;
    const heartbeat = await db.query.heartbeatMonitors.findFirst({
      where: eq(heartbeatMonitors.pingToken, token),
    });

    if (!heartbeat) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (heartbeat.paused) {
      return new NextResponse("Heartbeat is paused", { status: 200 });
    }

    const isRecovering = heartbeat.status === "down" || heartbeat.status === "late";

    let durationMs: number | undefined;
    let exitCode: number | undefined;
    let log: string | undefined;

    try {
      const body = await req.json();
      if (typeof body.duration === "number") durationMs = body.duration;
      if (typeof body.exitCode === "number") exitCode = body.exitCode;
      if (typeof body.log === "string") log = body.log;
    } catch (e) {
      // Ignored
    }

    // 1. Record the ping
    await db.insert(heartbeatPings).values({
      heartbeatId: heartbeat.id,
      sourceIp: ip,
      durationMs,
      exitCode,
      log,
    });

    // 2. Update the last ping time and status
    await db
      .update(heartbeatMonitors)
      .set({
        lastPingAt: new Date(),
        status: "up", // Reset to UP when a ping is received
      })
      .where(eq(heartbeatMonitors.id, heartbeat.id));

    // 3. Dispatch recovery alert if needed
    if (isRecovering) {
      await dispatchAlerts(null, heartbeat.id, "recovered");
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PING_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
