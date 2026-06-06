import { auth } from "@clerk/nextjs/server";
import { db, statusPages, statusPageMonitors } from "@steady-state/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { statusPageSchema } from "@/lib/validations/status-page";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const pages = await db
      .select()
      .from(statusPages)
      .where(eq(statusPages.userId, userId))
      .orderBy(desc(statusPages.createdAt));

    return NextResponse.json(pages);
  } catch (error) {
    console.error("[STATUS_PAGES_GET]", error);
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
    const body = statusPageSchema.parse(json);

    const { monitorIds, ...rest } = body;

    const [newPage] = await db
      .insert(statusPages)
      .values({
        ...rest,
        userId,
      })
      .returning();

    // Link monitors if provided
    if (monitorIds && monitorIds.length > 0) {
      await db.insert(statusPageMonitors).values(
        monitorIds.map((id, index) => ({
          statusPageId: newPage.id,
          monitorId: id,
          order: index,
        }))
      );
    }

    return NextResponse.json(newPage);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse(error.message, { status: 400 });
    }

    // Handle unique constraint violation for slug
    if ((error as any).code === "23505") {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    console.error("[STATUS_PAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
