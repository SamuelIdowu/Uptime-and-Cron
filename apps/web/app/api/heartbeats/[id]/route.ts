import { auth } from "@clerk/nextjs/server";
import { db, heartbeatMonitors } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { updateHeartbeatSchema } from "@/lib/validations/heartbeat";
import { generateToken } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const heartbeat = await db.query.heartbeatMonitors.findFirst({
      where: and(eq(heartbeatMonitors.id, id), eq(heartbeatMonitors.userId, userId)),
    });

    if (!heartbeat) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(heartbeat);
  } catch (error) {
    console.error("[HEARTBEAT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const { rotateToken, ...body } = updateHeartbeatSchema.parse(json);

    const updatePayload: any = { ...body };
    if (rotateToken) {
      updatePayload.pingToken = generateToken();
    }

    const heartbeat = await db
      .update(heartbeatMonitors)
      .set(updatePayload)
      .where(and(eq(heartbeatMonitors.id, id), eq(heartbeatMonitors.userId, userId)))
      .returning();

    if (heartbeat.length === 0) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(heartbeat[0]);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[HEARTBEAT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const heartbeat = await db
      .delete(heartbeatMonitors)
      .where(and(eq(heartbeatMonitors.id, id), eq(heartbeatMonitors.userId, userId)))
      .returning();

    if (heartbeat.length === 0) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(heartbeat[0]);
  } catch (error) {
    console.error("[HEARTBEAT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
