import { NextResponse } from "next/server";
import { runPoller } from "@/lib/worker/poller";
import { checkHeartbeats } from "@/lib/worker/heartbeat-checker";
import { sweepAlerts } from "@/lib/worker/alert-sweeper";
import { runAggregator } from "@/lib/worker/aggregator";

export const maxDuration = 60; // 1 minute
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  
  // 1. Verify Authorization
  // Use either Bearer token or ?secret= query param
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
  const isAuthorized = 
    authHeader === `Bearer ${secret}` || 
    searchParams.get("secret") === secret;

  if (!isAuthorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const task = searchParams.get("task") || "tick";

  try {
    console.log(`[Cron] Starting task: ${task}`);
    
    if (task === "tick") {
      // Run the standard 1-minute cycle
      await Promise.all([
        runPoller(),
        checkHeartbeats(),
        sweepAlerts()
      ]);
    } else if (task === "aggregate") {
      // Run the daily aggregation
      await runAggregator();
    } else {
      return new NextResponse(`Unknown task: ${task}`, { status: 400 });
    }

    return NextResponse.json({ 
        success: true, 
        task, 
        timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error(`[Cron Error] Task ${task} failed:`, error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
