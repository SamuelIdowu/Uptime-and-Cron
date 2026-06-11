import { auth } from "@clerk/nextjs/server";
import { db, teamMembers, invitations } from "@steady-state/db";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TeamMemberTable } from "@/components/team-member-table";
import { InvitationTable } from "@/components/invitation-table";
import { InviteMemberModal } from "@/components/invite-member-modal";
import { verifyWorkspaceAccess, verifyAdminAccess } from "@/lib/auth/workspace";
import { Users, ShieldCheck, Mail } from "lucide-react";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  const { workspaceId } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  // Verify access
  const { hasAccess, isOwner } = await verifyWorkspaceAccess(workspaceId, userId);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const isAdmin = await verifyAdminAccess(workspaceId, userId);

  // Fetch members
  const members = await db.query.teamMembers.findMany({
    where: eq(teamMembers.workspaceId, workspaceId),
    with: {
      user: true,
    },
    orderBy: (members, { asc }) => [asc(members.createdAt)],
  });

  // Fetch invitations
  const pendingInvitations = await db.query.invitations.findMany({
    where: and(
      eq(invitations.workspaceId, workspaceId),
      eq(invitations.status, "pending")
    ),
    orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-5 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="size-3 text-primary" />
            </div>
            <span className="eyebrow text-[10px] text-primary-soft font-bold tracking-[0.2em] uppercase">Operations Team</span>
          </div>
          <h1 className="display-md text-inkStrong uppercase tracking-tighter">Team Management</h1>
          <p className="text-mute text-xs font-mono uppercase tracking-tight opacity-70">
            Provision access and manage workspace operators.
          </p>
        </div>
        {isAdmin && (
          <InviteMemberModal workspaceId={workspaceId} />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-md bg-secondary/30 border border-border flex flex-col gap-1">
          <div className="flex items-center gap-2 text-mute mb-1">
            <Users className="size-3.5" />
            <span className="eyebrow text-[9px] font-bold tracking-widest uppercase">Active Operators</span>
          </div>
          <span className="display-sm text-inkStrong">{members.length}</span>
        </div>
        <div className="p-5 rounded-md bg-secondary/30 border border-border flex flex-col gap-1">
          <div className="flex items-center gap-2 text-mute mb-1">
            <Mail className="size-3.5" />
            <span className="eyebrow text-[9px] font-bold tracking-widest uppercase">Pending Invites</span>
          </div>
          <span className="display-sm text-inkStrong">{pendingInvitations.length}</span>
        </div>
        <div className="p-5 rounded-md bg-secondary/30 border border-border flex flex-col gap-1">
          <div className="flex items-center gap-2 text-mute mb-1">
            <ShieldCheck className="size-3.5" />
            <span className="eyebrow text-[9px] font-bold tracking-widest uppercase">Access Level</span>
          </div>
          <span className="display-sm text-inkStrong">{isOwner ? "OWNER" : isAdmin ? "ADMIN" : "VIEWER"}</span>
        </div>
      </div>

      <div className="space-y-12 pt-4">
        {/* Members Table */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary-soft" />
            <h2 className="eyebrow text-[11px] font-bold tracking-widest text-mute uppercase">Current Members</h2>
          </div>
          <TeamMemberTable 
            members={members as any} 
            workspaceId={workspaceId}
            currentUserId={userId}
            isOwner={isOwner}
            isAdmin={isAdmin}
          />
        </section>

        {/* Invitations Table */}
        {pendingInvitations.length > 0 && (
          <InvitationTable 
            invitations={pendingInvitations as any} 
            isAdmin={isAdmin} 
          />
        )}
      </div>
    </main>
  );
}
