import { auth } from "@clerk/nextjs/server";
import { db, statusPages, statusPageMonitors } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { updateStatusPageSchema } from "@/lib/validations/status-page";

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
    const page = await db.query.statusPages.findFirst({
      where: and(eq(statusPages.id, id), eq(statusPages.userId, userId)),
      with: {
        monitors: {
          with: {
            monitor: true,
          },
          orderBy: (spm, { asc }) => [asc(spm.order)],
        },
      },
    });

    if (!page) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("[STATUS_PAGE_GET]", error);
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
    const { monitorIds, ...body } = updateStatusPageSchema.parse(json);

    const [updatedPage] = await db
      .update(statusPages)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(statusPages.id, id), eq(statusPages.userId, userId)))
      .returning();

    if (!updatedPage) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    // Update monitors if provided
    if (monitorIds) {
      await db.transaction(async (tx) => {
        await tx
          .delete(statusPageMonitors)
          .where(eq(statusPageMonitors.statusPageId, id));

        if (monitorIds.length > 0) {
          await tx.insert(statusPageMonitors).values(
            monitorIds.map((mId, index) => ({
              statusPageId: id,
              monitorId: mId,
              order: index,
            }))
          );
        }
      });
    }

    return NextResponse.json(updatedPage);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[STATUS_PAGE_PATCH]", error);
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
      .delete(statusPages)
      .where(and(eq(statusPages.id, id), eq(statusPages.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return NextResponse.json(deleted[0]);
  } catch (error) {
    console.error("[STATUS_PAGE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
