import { auth, currentUser } from "@clerk/nextjs/server";
import { db, invitations, users, teamMembers } from "@steady-state/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/auth/workspace";
import crypto from "crypto";
import { sendInviteEmail } from "@steady-state/notifications";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { workspaceId, email, role } = await req.json();

    if (!workspaceId || !email || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 1. Verify admin access
    const isAdmin = await verifyAdminAccess(workspaceId, userId);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2. Check for existing invitation (active or otherwise)
    // Due to unique constraint on (email, workspaceId)
    const existingInvite = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.workspaceId, workspaceId),
        eq(invitations.email, email)
      ),
    });

    if (existingInvite) {
      // If it's still pending and not expired, we can either reject or resend.
      // For simplicity, we'll delete the old one and create a fresh one.
      await db.delete(invitations).where(eq(invitations.id, existingInvite.id));
    }

    // 3. Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Create invitation
    const [invitation] = await db.insert(invitations).values({
      workspaceId,
      email,
      role,
      token,
      invitedBy: userId,
      expiresAt,
    }).returning();

    // 5. Fetch context for email
    const workspace = await db.query.users.findFirst({
      where: eq(users.id, workspaceId),
    });
    
    const inviter = await currentUser();
    const inviterName = inviter?.firstName 
        ? `${inviter.firstName} ${inviter.lastName}` 
        : inviter?.emailAddresses[0]?.emailAddress || "A team member";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/invite/${token}`;

    // 6. Send email
    const emailRes = await sendInviteEmail({
      to: email,
      workspaceName: workspace?.email ? `${workspace.email.split("@")[0]}'s Team` : "SteadyState Team",
      inviterName,
      inviteLink,
    });

    if (!emailRes.success) {
      console.error("[TEAM_INVITE_EMAIL_ERROR]", emailRes.error);
      // We still return the invitation object but maybe add a warning or handle differently
      // For now, let's keep it simple and just log it, or return a 500 if we want to be strict.
      // Actually, it's better to return 500 if the email fails so the user knows.
      return new NextResponse("Failed to send invite email. Please check your notification settings.", { status: 500 });
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[TEAM_INVITE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
