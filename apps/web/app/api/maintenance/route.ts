import { auth } from "@clerk/nextjs/server";
import { db, maintenanceWindows } from "@steady-state/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { maintenanceSchema } from "@/lib/validations/maintenance";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const windows = await db
      .select()
      .from(maintenanceWindows)
      .where(
        and(
            eq(maintenanceWindows.userId, userId),
            gte(maintenanceWindows.endTime, new Date()) // Only active or future windows
        )
      )
      .orderBy(desc(maintenanceWindows.startTime));

    return NextResponse.json(windows);
  } catch (error) {
    console.error("[MAINTENANCE_GET]", error);
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
    const body = maintenanceSchema.parse(json);

    const [newWindow] = await db
      .insert(maintenanceWindows)
      .values({
        ...body,
        userId,
      })
      .returning();

    return NextResponse.json(newWindow);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[MAINTENANCE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
