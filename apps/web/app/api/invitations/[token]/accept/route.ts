import { auth, currentUser } from "@clerk/nextjs/server";
import { db, invitations, teamMembers, users } from "@steady-state/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { token } = await params;

  try {
    // 1. Find and validate invitation
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
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

    // 2. Ensure user record exists in our DB (sync if needed)
    // In our system, users are usually created on first sign-in or via Clerk sync
    // We'll check and create if missing just in case
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser) {
      await db.insert(users).values({
        id: userId,
        email: user.emailAddresses[0].emailAddress,
      });
    }

    // 3. Check if already a member
    const existingMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.workspaceId, invite.workspaceId),
        eq(teamMembers.userId, userId)
      ),
    });

    if (existingMembership) {
      // Already a member, just mark invite as accepted
      await db.update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invite.id));
      
      return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
    }

    // 4. Create membership and update invitation status in a transaction
    await db.transaction(async (tx: any) => {
      await tx.insert(teamMembers).values({
        workspaceId: invite.workspaceId,
        userId: userId,
        role: invite.role,
      });

      await tx.update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invite.id));
    });

    return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
  } catch (error) {
    console.error("[INVITATION_ACCEPT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
