import { db, statusPages } from "@steady-state/db";
import { eq, and, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const excludeId = searchParams.get("excludeId");

  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug is required" });
  }

  try {
    const existing = await db.query.statusPages.findFirst({
      where: excludeId 
        ? and(eq(statusPages.slug, slug), ne(statusPages.id, excludeId))
        : eq(statusPages.slug, slug),
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error("[CHECK_SLUG_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
