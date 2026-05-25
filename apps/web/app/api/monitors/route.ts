import { auth, currentUser } from "@clerk/nextjs/server";
import { db, monitors, users, alertSettings } from "@steady-state/db";
import { desc, eq, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { monitorSchema } from "@/lib/validations/monitor";
import { PLAN_LIMITS } from "@/lib/constants";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.userId, userId))
      .orderBy(desc(monitors.createdAt));

    return NextResponse.json(userMonitors);
  } catch (error) {
    console.error("[MONITORS_GET]", error);
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
    const body = monitorSchema.parse(json);

    // 1. Fetch user plan and current monitor count
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
    
    const monitorCount = Number(monitorCountResult.val);

    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];

    // 2. Check max monitors
    if (monitorCount >= limits.maxMonitors) {
        return new NextResponse("Monitor limit reached. Upgrade to add more.", { status: 403 });
    }

    // 3. Check min interval
    if (body.intervalMinutes < limits.minIntervalMinutes) {
        return new NextResponse(`Minimum interval for your plan is ${limits.minIntervalMinutes} minutes.`, { status: 403 });
    }

    const monitor = await db
      .insert(monitors)
      .values({
        userId,
        name: body.name,
        url: body.url,
        intervalMinutes: body.intervalMinutes,
        expectedStatus: body.expectedStatus,
        autoRetry: body.autoRetry,
        sslPolicy: body.sslPolicy,
      })
      .returning();

    return NextResponse.json(monitor[0]);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[MONITORS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
