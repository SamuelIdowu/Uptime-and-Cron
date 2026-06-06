import { db, heartbeatMonitors, heartbeatPings, dispatchAlerts } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. Upstash Redis Rate Limiting (Production)
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "@steady-state/ratelimit",
  });
}

// 2. In-memory fallback (Local Development / No Upstash)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // Max 30 pings per minute per IP

async function checkRateLimit(ip: string): Promise<boolean> {
  // Use Upstash if configured
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    return !success;
  }

  // Fallback to in-memory
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

    if (await checkRateLimit(ip)) {
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

const MAX_LOG_SIZE = 10 * 1024; // 10KB

function truncateLog(log: string): string {
  if (log.length <= MAX_LOG_SIZE) return log;
  return log.slice(-MAX_LOG_SIZE) + "\n... (truncated)";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const headerPayload = await headers();
    const ip = headerPayload.get("x-forwarded-for") || "unknown";

    if (await checkRateLimit(ip)) {
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

    let durationMs: number | undefined;
    let exitCode: number | undefined;
    let log: string | undefined;

    try {
      const body = await req.json();
      if (typeof body.duration === "number") durationMs = body.duration;
      if (typeof body.exitCode === "number") exitCode = body.exitCode;
      if (typeof body.log === "string") log = truncateLog(body.log);
    } catch (e) {
      // Ignored
    }

    const newStatus = (exitCode === 0 || exitCode === undefined || exitCode === null) ? "up" : "down";
    const isRecovering = (heartbeat.status === "down" || heartbeat.status === "late") && newStatus === "up";
    const isFailing = heartbeat.status !== "down" && newStatus === "down";

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
        status: newStatus,
      })
      .where(eq(heartbeatMonitors.id, heartbeat.id));

    // 3. Dispatch alerts
    if (isRecovering) {
      await dispatchAlerts(null, heartbeat.id, "recovered");
    } else if (isFailing) {
      await dispatchAlerts(null, heartbeat.id, "down");
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PING_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
