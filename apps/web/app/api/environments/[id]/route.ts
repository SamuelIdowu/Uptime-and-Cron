import { auth } from "@clerk/nextjs/server";
import { db, environments } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const environmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  baseUrl: z.string().url().max(2048).optional(),
});

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
    const body = environmentSchema.parse(json);

    const environment = await db
      .update(environments)
      .set(body)
      .where(and(eq(environments.id, id), eq(environments.userId, userId)))
      .returning();

    if (environment.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(environment[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }

    console.error("[ENVIRONMENT_PATCH]", error);
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
    const environment = await db
      .delete(environments)
      .where(and(eq(environments.id, id), eq(environments.userId, userId)))
      .returning();

    if (environment.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(environment[0]);
  } catch (error) {
    console.error("[ENVIRONMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
