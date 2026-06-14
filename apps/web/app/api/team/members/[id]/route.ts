import { auth } from "@clerk/nextjs/server";
import { db, teamMembers } from "@steady-state/db";
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
    const memberId = id;

    // 1. Fetch member to get workspaceId
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
    });

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // 2. Verify admin access (Owner/Admin only)
    const isAdmin = await verifyAdminAccess(member.workspaceId, userId);
    
    // A user can also remove themselves
    const isSelf = member.userId === userId;

    if (!isAdmin && !isSelf) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Remove member
    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TEAM_MEMBER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
