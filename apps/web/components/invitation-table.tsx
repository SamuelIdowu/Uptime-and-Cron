"use client";

import { Invitation } from "@steady-state/db";
import { MoreVertical, Trash2, Mail, Clock, Shield, Eye } from "lucide-react";
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

interface InvitationTableProps {
  invitations: Invitation[];
  isAdmin: boolean;
}

export function InvitationTable({ invitations, isAdmin }: InvitationTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const onRevokeInvitation = async (invitationId: string) => {
    setIsLoading(invitationId);
    try {
      const res = await fetch(`/api/team/invites/${invitationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to revoke invitation");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="size-4 text-primary-soft" />
        <h3 className="eyebrow text-[11px] font-bold tracking-widest text-mute uppercase">Pending Invitations</h3>
      </div>
      
      <div className="w-full overflow-hidden rounded-md bg-background border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Email</th>
                <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Role</th>
                <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 hidden md:table-cell">Expires</th>
                <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invitations.map((invite) => {
                const isExpired = new Date(invite.expiresAt) < new Date();

                return (
                  <tr key={invite.id} className="group hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-ink tracking-tight">{invite.email}</span>
                        {isExpired && (
                          <span className="text-[10px] text-destructive font-bold uppercase tracking-tighter">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {invite.role === 'admin' ? (
                          <Shield className="size-3.5 text-primary-soft" />
                        ) : (
                          <Eye className="size-3.5 text-mute" />
                        )}
                        <span className="text-xs font-mono uppercase tracking-widest text-mute">
                          {invite.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-mute">
                        <Clock className="size-3" />
                        <span className="text-[11px] font-mono">
                          {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover border border-border rounded-md shadow-xl p-1">
                            <DropdownMenuItem 
                              onClick={() => onRevokeInvitation(invite.id)}
                              disabled={isLoading === invite.id}
                              className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                            >
                              <Trash2 className="size-4 mr-2" /> Revoke Invite
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
    </div>
  );
}
