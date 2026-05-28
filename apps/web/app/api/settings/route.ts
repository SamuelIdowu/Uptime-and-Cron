import { auth } from "@clerk/nextjs/server";
import { db, alertSettings, users } from "@steady-state/db";
import { encrypt, decrypt } from "@steady-state/notifications";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
  email: z.string().email().optional(),
  slackWebhookUrl: z.string().url().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  telegramBotToken: z.string().optional().nullable(),
  appUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const settings = await db.query.alertSettings.findFirst({
      where: eq(alertSettings.userId, userId),
    });

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        appUrl: true,
      }
    });

    if (settings) {
      if (settings.slackWebhookUrl) {
        settings.slackWebhookUrl = decrypt(settings.slackWebhookUrl) ?? settings.slackWebhookUrl;
      }
      if (settings.telegramBotToken) {
        settings.telegramBotToken = decrypt(settings.telegramBotToken) ?? settings.telegramBotToken;
      }
    }

    return NextResponse.json({
      ...settings,
      appUrl: user?.appUrl,
    });
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = settingsSchema.parse(json);

    const { appUrl: newAppUrl, ...alertBody } = body;

    // Encrypt sensitive fields
    if (alertBody.slackWebhookUrl) {
      alertBody.slackWebhookUrl = encrypt(alertBody.slackWebhookUrl) ?? alertBody.slackWebhookUrl;
    }
    if (alertBody.telegramBotToken) {
      alertBody.telegramBotToken = encrypt(alertBody.telegramBotToken) ?? alertBody.telegramBotToken;
    }

    const results = await Promise.all([
      db
        .update(alertSettings)
        .set({
          ...alertBody,
          updatedAt: new Date(),
        })
        .where(eq(alertSettings.userId, userId))
        .returning(),
      newAppUrl !== undefined ? 
        db.update(users).set({ appUrl: newAppUrl }).where(eq(users.id, userId)).returning({ appUrl: users.appUrl }) : 
        Promise.resolve([])
    ]);

    const settings = results[0][0];
    const user = results[1][0];

    // Decrypt for response
    if (settings.slackWebhookUrl) {
      settings.slackWebhookUrl = decrypt(settings.slackWebhookUrl) ?? settings.slackWebhookUrl;
    }
    if (settings.telegramBotToken) {
      settings.telegramBotToken = decrypt(settings.telegramBotToken) ?? settings.telegramBotToken;
    }

    return NextResponse.json({
      ...settings,
      appUrl: user?.appUrl ?? (await db.query.users.findFirst({ where: eq(users.id, userId), columns: { appUrl: true } }))?.appUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("[SETTINGS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
