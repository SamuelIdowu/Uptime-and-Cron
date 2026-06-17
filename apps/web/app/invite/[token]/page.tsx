import { db, invitations } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Shield, Zap, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcceptInviteButton } from "./accept-button";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with: {
      workspace: true,
      inviter: true,
    },
  });

  if (!invite || invite.status !== "pending" || invite.expiresAt < new Date()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-md shadow-2xl text-center space-y-6">
          <div className="size-16 mx-auto rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <Shield className="size-8 text-destructive" />
          </div>
          <h1 className="display-sm text-inkStrong uppercase tracking-tighter">Invitation Void</h1>
          <p className="text-mute text-sm font-mono uppercase tracking-tight opacity-70">
            This invitation has expired, been revoked, or does not exist in our registry.
          </p>
          <Button variant="outline" className="w-full eyebrow text-[11px]" onClick={() => window.location.href = "/"}>
            Return to Base
          </Button>
        </div>
      </div>
    );
  }

  const workspaceName = invite.workspace?.email 
    ? `${invite.workspace.email.split("@")[0]}'s Team` 
    : "SteadyState Team";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-sm bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,217,146,0.3)]">
              <Zap className="size-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-inkStrong font-sans uppercase">SteadyState</span>
          </div>
        </div>

        {/* Invite Card */}
        <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-border bg-secondary/30 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="size-3 text-primary" />
              <span className="eyebrow text-[9px] font-bold tracking-widest text-primary uppercase">Secure Access Invitation</span>
            </div>
            <h1 className="display-md text-inkStrong uppercase tracking-tighter mb-2">Join the Operations Team</h1>
            <p className="text-mute text-xs font-mono uppercase tracking-tight opacity-70">
              You have been provisioned access to a monitoring workspace.
            </p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="eyebrow text-[9px] text-mute uppercase tracking-widest">Workspace</span>
                <p className="text-sm font-bold text-inkStrong">{workspaceName}</p>
              </div>
              <div className="space-y-1">
                <span className="eyebrow text-[9px] text-mute uppercase tracking-widest">Invited By</span>
                <p className="text-sm font-bold text-inkStrong">{invite.inviter?.email || "Team Member"}</p>
              </div>
              <div className="space-y-1">
                <span className="eyebrow text-[9px] text-mute uppercase tracking-widest">Access Role</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono font-bold uppercase tracking-tighter">
                    {invite.role}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="eyebrow text-[9px] text-mute uppercase tracking-widest">Target Node</span>
                <p className="text-sm font-bold text-inkStrong truncate">{invite.email}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40">
              <AcceptInviteButton token={token} />
              <p className="text-center mt-4 text-[10px] text-mute font-mono uppercase opacity-50">
                By accepting, you agree to the SteadyState terms of operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
