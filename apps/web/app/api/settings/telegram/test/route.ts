import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@steady-state/notifications";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { chatId, botToken } = await req.json();

    if (!chatId || !botToken) {
      return new NextResponse("Chat ID and Bot Token are required", { status: 400 });
    }

    const res = await sendTelegramAlert(
      botToken,
      chatId,
      "Test Monitor",
      "up",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );

    if (res.success) {
      return new NextResponse("Success", { status: 200 });
    } else {
      return new NextResponse("Failed to send", { status: 500 });
    }
  } catch (error) {
    console.error("[TELEGRAM_TEST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
