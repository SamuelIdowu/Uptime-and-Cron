import { auth } from "@clerk/nextjs/server";
import { db, alertSettings } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
  email: z.string().email().optional(),
  slackWebhookUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const settings = await db.query.alertSettings.findFirst({
      where: eq(alertSettings.userId, userId),
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = settingsSchema.parse(json);

    const settings = await db
      .update(alertSettings)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(alertSettings.userId, userId))
      .returning();

    return NextResponse.json(settings[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("[SETTINGS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
