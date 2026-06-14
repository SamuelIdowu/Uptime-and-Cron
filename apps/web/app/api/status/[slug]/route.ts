import { readDb, statusPages, monitors } from "@steady-state/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const page = await readDb.query.statusPages.findFirst({
      where: eq(statusPages.slug, slug),
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

    if (!page.published) {
        // Maybe allow preview with a secret token later
        return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("[PUBLIC_STATUS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
