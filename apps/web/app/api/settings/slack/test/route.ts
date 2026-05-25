import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendSlackAlert } from "@/lib/slack";

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new NextResponse("Webhook URL is required", { status: 400 });
    }

    const res = await sendSlackAlert(url, "SteadyState Test", "up", "https://steadystate.dev");

    if (res.success) {
      return new NextResponse("Test alert sent", { status: 200 });
    } else {
      return new NextResponse(JSON.stringify(res.error), { status: 400 });
    }
  } catch (error) {
    console.error("[SLACK_TEST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
