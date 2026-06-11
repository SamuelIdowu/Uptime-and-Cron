import { auth } from "@clerk/nextjs/server";
import { db, maintenanceWindows } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { updateMaintenanceSchema } from "@/lib/validations/maintenance";

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
    const window = await db.query.maintenanceWindows.findFirst({
      where: and(eq(maintenanceWindows.id, id), eq(maintenanceWindows.userId, userId)),
    });

    if (!window) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(window);
  } catch (error) {
    console.error("[MAINTENANCE_ID_GET]", error);
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
    const body = updateMaintenanceSchema.parse(json);

    const [updatedWindow] = await db
      .update(maintenanceWindows)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceWindows.id, id), eq(maintenanceWindows.userId, userId)))
      .returning();

    if (!updatedWindow) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(updatedWindow);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[MAINTENANCE_PATCH]", error);
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
    const deleted = await db
      .delete(maintenanceWindows)
      .where(and(eq(maintenanceWindows.id, id), eq(maintenanceWindows.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(deleted[0]);
  } catch (error) {
    console.error("[MAINTENANCE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
