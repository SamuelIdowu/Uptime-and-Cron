import { db, invitations } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
      with: {
        workspace: true,
        inviter: true,
      },
    });

    if (!invite) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    if (invite.status !== "pending") {
      return new NextResponse(`Invitation is ${invite.status}`, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return new NextResponse("Invitation expired", { status: 400 });
    }

    return NextResponse.json({
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspace?.email ? `${invite.workspace.email.split("@")[0]}'s Team` : "SteadyState Team",
      role: invite.role,
      inviterEmail: invite.inviter?.email,
    });
  } catch (error) {
    console.error("[INVITATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
