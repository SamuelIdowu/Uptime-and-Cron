import { auth, currentUser } from "@clerk/nextjs/server";
import { db, heartbeatMonitors, users, monitors, alertSettings } from "@steady-state/db";
import { desc, eq, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { heartbeatSchema } from "@/lib/validations/heartbeat";
import { generateToken } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/constants";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const heartbeats = await db
      .select()
      .from(heartbeatMonitors)
      .where(eq(heartbeatMonitors.userId, userId))
      .orderBy(desc(heartbeatMonitors.createdAt));

    return NextResponse.json(heartbeats);
  } catch (error) {
    console.error("[HEARTBEATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = heartbeatSchema.parse(json);

    // 1. Fetch user plan and total monitor count (HTTP + Heartbeat)
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
        // Auto-Sync Hack: If user isn't in DB yet, create them (webhook might be slow)
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return new NextResponse("User not found in Clerk", { status: 404 });
        }

        const email = clerkUser.emailAddresses[0].emailAddress;
        
        const [newUser] = await db
            .insert(users)
            .values({
                id: userId,
                email,
            })
            .returning();
        
        user = newUser;

        // Initialize alert settings
        await db.insert(alertSettings).values({
            userId,
            email,
        });
    }

    const [monitorCountResult] = await db
      .select({ val: count() })
      .from(monitors)
      .where(eq(monitors.userId, userId));
    
    const [heartbeatCountResult] = await db
      .select({ val: count() })
      .from(heartbeatMonitors)
      .where(eq(heartbeatMonitors.userId, userId));
    
    const totalCount = Number(monitorCountResult.val) + Number(heartbeatCountResult.val);

    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];

    // 2. Check max monitors
    if (totalCount >= limits.maxMonitors) {
        return new NextResponse("Monitor limit reached. Upgrade to add more.", { status: 403 });
    }

    const heartbeat = await db
      .insert(heartbeatMonitors)
      .values({
        userId,
        name: body.name,
        periodMinutes: body.periodMinutes,
        graceMinutes: body.graceMinutes,
        pingToken: generateToken(),
      })
      .returning();

    return NextResponse.json(heartbeat[0]);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[HEARTBEATS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
