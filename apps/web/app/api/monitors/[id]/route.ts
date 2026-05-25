import { auth } from "@clerk/nextjs/server";
import { db, monitors } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { updateMonitorSchema } from "@/lib/validations/monitor";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const monitor = await db.query.monitors.findFirst({
      where: and(eq(monitors.id, id), eq(monitors.userId, userId)),
    });

    if (!monitor) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error("[MONITOR_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = updateMonitorSchema.parse(json);

    const monitor = await db
      .update(monitors)
      .set({
        ...body,
        // Ensure userId stays the same
      })
      .where(and(eq(monitors.id, id), eq(monitors.userId, userId)))
      .returning();

    if (monitor.length === 0) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(monitor[0]);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[MONITOR_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const monitor = await db
      .delete(monitors)
      .where(and(eq(monitors.id, id), eq(monitors.userId, userId)))
      .returning();

    if (monitor.length === 0) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(monitor[0]);
  } catch (error) {
    console.error("[MONITOR_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
