import { db, teamMembers } from "@steady-state/db";
import { eq, and } from "drizzle-orm";

/**
 * Verifies if a user has access to a workspace.
 * A user has access if:
 * 1. They are the owner (workspaceId === userId)
 * 2. They are a member in the team_members table
 */
export async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  // 1. Owner access
  if (workspaceId === userId) {
    return {
      hasAccess: true,
      role: "owner" as const,
      isOwner: true,
    };
  }

  // 2. Team member access
  const membership = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.workspaceId, workspaceId),
      eq(teamMembers.userId, userId)
    ),
  });

  if (membership) {
    return {
      hasAccess: true,
      role: membership.role,
      isOwner: false,
    };
  }

  return {
    hasAccess: false,
    role: null,
    isOwner: false,
  };
}

/**
 * Verifies if a user has admin access to a workspace.
 * Owners and Admins have admin access.
 */
export async function verifyAdminAccess(workspaceId: string, userId: string) {
  const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, userId);
  
  if (!hasAccess) return false;
  
  return role === "owner" || role === "admin";
}
