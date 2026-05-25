import { auth } from "@clerk/nextjs/server";
import { db, alertSettings, users, monitors } from "@steady-state/db";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Activity, Bell, Mail, Slack, CreditCard, ShieldAlert } from "lucide-react";
import { AlertChannelForm } from "./alert-channel-form";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/lib/constants";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user is accessing their own workspace for now
  if (userId !== workspaceId) {
    redirect(`/${userId}/settings`);
  }

  const settings = await db.query.alertSettings.findFirst({
    where: eq(alertSettings.userId, userId),
  });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const monitorCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(monitors)
    .where(eq(monitors.userId, userId))
    .then(res => res[0].count);

  const limits = PLAN_LIMITS[user?.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const usagePercent = Math.min(100, (monitorCount / limits.maxMonitors) * 100);

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="space-y-4 border-b border-border/40 pb-10">
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-md bg-secondary border border-border flex items-center justify-center">
                <Activity className="size-5 text-primary-soft" />
             </div>
             <h1 className="display-lg text-inkStrong uppercase">Settings</h1>
          </div>
          <p className="text-mute text-sm font-mono">
            Configure your global monitoring infrastructure and notification matrix.
          </p>
        </header>

        <div className="space-y-20 pb-20">
          {/* Notifications Section */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="display-sm text-ink uppercase tracking-tight">Notification Channels</h2>
              <p className="text-xs text-mute font-mono">Define where alerts are dispatched when nodes go offline.</p>
            </div>
            
            <AlertChannelForm initialData={settings} />
          </section>

          {/* Plan & Billing Section */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="display-sm text-ink uppercase tracking-tight">Provisioning & Quota</h2>
              <p className="text-xs text-mute font-mono">Monitor your resource allocation and compute limits.</p>
            </div>
            
            <div className="space-y-8 p-8 bg-card border border-border rounded-md">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-inkStrong font-mono uppercase tracking-tight">Current Plan: {user?.plan === 'paid' ? 'Pro Tier' : 'Free Tier'}</p>
                  <p className="text-[11px] text-mute font-mono uppercase">MIN CHECK INTERVAL: {user?.plan === 'paid' ? '60 SECONDS' : '5 MINUTES'}</p>
                </div>
                <Button size="sm" variant="outline" className="eyebrow text-[10px] h-9">Upgrade Plan</Button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold eyebrow text-mute">
                  <span>Monitor Units</span>
                  <span className="text-ink">{monitorCount} / {limits.maxMonitors} USED</span>
                </div>
                <div className="h-2 w-full bg-secondary border border-border">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${usagePercent}%` }} 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="display-sm text-destructive uppercase tracking-tight">Decommissioning</h2>
              <p className="text-xs text-mute font-mono">Permanently terminate your monitoring cluster and purge all logs.</p>
            </div>
            
            <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-md">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-destructive font-mono uppercase tracking-tight">Delete Account</p>
                  <p className="text-[11px] text-mute font-mono max-w-md uppercase tracking-tight">Warning: This action is instantaneous and cannot be reversed. All monitoring data will be wiped.</p>
                </div>
                <Button variant="destructive" size="sm" className="eyebrow text-[10px] px-8 h-10">Delete Cluster</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
