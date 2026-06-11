"use client";

import { TeamMember, User } from "@steady-state/db";
import { MoreVertical, Trash2, Shield, Eye, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";

interface TeamMemberWithUser extends TeamMember {
  user: User;
}

interface TeamMemberTableProps {
  members: TeamMemberWithUser[];
  workspaceId: string;
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export function TeamMemberTable({ 
  members, 
  workspaceId, 
  currentUserId,
  isOwner,
  isAdmin
}: TeamMemberTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMemberWithUser | null>(null);

  const onRemoveMember = async () => {
    if (!memberToDelete) return;
    setIsLoading(memberToDelete.id);
    
    try {
      const res = await fetch(`/api/team/members/${memberToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove member");
      }

      router.refresh();
      setMemberToDelete(null);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-md bg-background border border-border shadow-sm">
      <ConfirmationModal 
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title="Revoke Access"
        description={`Are you sure you want to remove ${memberToDelete?.user.email} from the team? They will immediately lose access to all monitors and configurations.`}
        confirmText="Remove Member"
        variant="destructive"
        onConfirm={onRemoveMember}
        isLoading={isLoading === memberToDelete?.id}
      />
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Member</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Role</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 hidden md:table-cell">Joined</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const isTargetOwner = member.userId === workspaceId;
              
              // Can only remove if:
              // 1. Current user is admin/owner
              // 2. Target is not the owner
              // 3. Target is not self (unless owner removing others)
              const canRemove = (isAdmin || isOwner) && !isTargetOwner && !isSelf;

              return (
                <tr key={member.id} className="group hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                        <UserIcon className="size-4 text-mute" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-ink truncate tracking-tight">
                          {member.user.email}
                          {isSelf && <span className="ml-2 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">You</span>}
                          {isTargetOwner && <span className="ml-2 text-[10px] text-primary-soft bg-primary-soft/10 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Owner</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {member.role === 'admin' ? (
                        <Shield className="size-3.5 text-primary-soft" />
                      ) : (
                        <Eye className="size-3.5 text-mute" />
                      )}
                      <span className="text-xs font-mono uppercase tracking-widest text-mute">
                        {member.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell whitespace-nowrap">
                    <span className="text-[11px] font-mono text-mute">
                      {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    {canRemove && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-popover border border-border rounded-md shadow-xl p-1">
                          <DropdownMenuItem 
                            onClick={() => setMemberToDelete(member)}
                            disabled={isLoading === member.id}
                            className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                          >
                            <Trash2 className="size-4 mr-2" /> Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
