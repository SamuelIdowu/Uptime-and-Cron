import { auth } from "@clerk/nextjs/server";
import { db, invitations } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/auth/workspace";

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
    const inviteId = id;

    // 1. Fetch invite to get workspaceId
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.id, inviteId),
    });

    if (!invite) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    // 2. Verify admin access (Owner/Admin only)
    const isAdmin = await verifyAdminAccess(invite.workspaceId, userId);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Revoke invite
    await db.update(invitations)
      .set({ status: "revoked" })
      .where(eq(invitations.id, inviteId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TEAM_INVITE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
