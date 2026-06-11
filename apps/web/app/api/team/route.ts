import { auth } from "@clerk/nextjs/server";
import { db, teamMembers, invitations, users } from "@steady-state/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyWorkspaceAccess } from "@/lib/auth/workspace";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return new NextResponse("Workspace ID required", { status: 400 });
  }

  try {
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch workspace owner
    const workspaceOwner = await db.query.users.findFirst({
      where: eq(users.id, workspaceId),
    });

    // Fetch team members
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.workspaceId, workspaceId),
      with: {
        user: true,
      },
    });

    // Fetch pending invitations
    const pendingInvites = await db.query.invitations.findMany({
      where: and(
        eq(invitations.workspaceId, workspaceId),
        eq(invitations.status, "pending")
      ),
    });

    // Format results to include owner
    const allMembers = [
      ...(workspaceOwner ? [{
        id: "owner-" + workspaceOwner.id,
        userId: workspaceOwner.id,
        role: "owner",
        user: workspaceOwner,
        createdAt: workspaceOwner.createdAt,
      }] : []),
      ...members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user,
        createdAt: m.createdAt,
      }))
    ];

    return NextResponse.json({
      members: allMembers,
      invitations: pendingInvites,
    });
  } catch (error) {
    console.error("[TEAM_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
