import { auth } from "@clerk/nextjs/server";
import { db, environments } from "@steady-state/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const environmentSchema = z.object({
  name: z.string().min(1).max(255),
  baseUrl: z.string().url().max(2048),
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userEnvironments = await db
      .select()
      .from(environments)
      .where(eq(environments.userId, userId))
      .orderBy(environments.createdAt);

    return NextResponse.json(userEnvironments);
  } catch (error) {
    console.error("[ENVIRONMENTS_GET]", error);
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
    const body = environmentSchema.parse(json);

    const environment = await db
      .insert(environments)
      .values({
        userId,
        name: body.name,
        baseUrl: body.baseUrl,
      })
      .returning();

    return NextResponse.json(environment[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[ENVIRONMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
