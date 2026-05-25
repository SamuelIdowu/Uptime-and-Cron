import { db, heartbeatMonitors, heartbeatPings } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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

    const headerPayload = await headers();
    const ip = headerPayload.get("x-forwarded-for") || "unknown";

    await db.transaction(async (tx) => {
      // 1. Record the ping
      await tx.insert(heartbeatPings).values({
        heartbeatId: heartbeat.id,
        sourceIp: ip,
      });

      // 2. Update the last ping time and status
      await tx
        .update(heartbeatMonitors)
        .set({
          lastPingAt: new Date(),
          status: "up", // Reset to UP when a ping is received
        })
        .where(eq(heartbeatMonitors.id, heartbeat.id));
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Support POST as well for convenience
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return GET(req, { params });
}
