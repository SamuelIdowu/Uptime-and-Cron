import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, monitors, heartbeatMonitors, users, alertSettings, monitorEvents, heartbeatPings, monitorChecks } from "@steady-state/db";
import { desc, eq } from "drizzle-orm";
import { subDays } from "date-fns";
import { MonitorTable } from "@/components/monitor-table";
import { TerminalEmptyState } from "@/components/terminal-empty-state";
import { PlanLimitBanner } from "@/components/plan-limit-banner";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Zap, Heart, MonitorCheck, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLAN_LIMITS } from "@/lib/constants";

import { CreateMonitorModal } from "@/components/create-monitor-modal";

async function syncUserRecord(userId: string) {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/sign-up");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  
  // Create user and default alert settings sequentially
  const newUser = await db.insert(users).values({
    id: userId,
    email: email || "unknown@example.com",
    plan: "free",
  }).returning();
  
  await db.insert(alertSettings).values({
    userId: userId,
    email: email || "unknown@example.com",
  });
  
  console.log(`[Auto-Sync] Created local record for user: ${userId}`);
  return newUser[0];
}

import { headers } from "next/headers";

export default async function InfrastructureDashboard({
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
    redirect(`/${userId}/dashboard`);
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // --- Auto-Sync Hack for Development ---
  if (!user) {
    user = await syncUserRecord(userId);
  }

  const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = user?.appUrl || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  // Fetch monitors and heartbeats sequentially for debugging performance marks
  const userMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
    orderBy: desc(monitors.createdAt),
    with: {
      checks: {
        orderBy: desc(monitorChecks.createdAt),
        limit: 50,
      },
    },
  });

  const userHeartbeats = await db.query.heartbeatMonitors.findMany({
    where: eq(heartbeatMonitors.userId, userId),
    orderBy: desc(heartbeatMonitors.createdAt),
    with: {
      pings: {
        orderBy: desc(heartbeatPings.receivedAt),
        limit: 50,
      },
    },
  });

  const unifiedMonitors = [
    ...userMonitors.map(m => ({ ...m, type: 'http' as const })),
    ...userHeartbeats.map(h => ({ ...h, type: 'heartbeat' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = unifiedMonitors.reduce(
    (acc, m) => {
      if (m.paused) acc.paused++;
      else if (m.status === "up") acc.up++;
      else if (m.status === "down" || m.status === "late") acc.down++;
      
      const uptime = (m as any).uptime30d;
      if (uptime) {
        acc.totalUptime += parseFloat(uptime);
        acc.uptimeCount++;
      } else {
        // Fallback for new monitors: calculate from recent checks/pings
        if (m.type === 'http') {
          const checks = (m as any).checks || [];
          if (checks.length > 0) {
            const upChecks = checks.filter((c: any) => c.status === 'up').length;
            acc.totalUptime += (upChecks / checks.length) * 100;
            acc.uptimeCount++;
          }
        } else {
          const pings = (m as any).pings || [];
          if (pings.length > 0) {
            acc.totalUptime += 100; // If it has pings and is not down/late, it's 100% for now
            acc.uptimeCount++;
          }
        }
      }
      return acc;
    },
    { up: 0, down: 0, paused: 0, totalUptime: 0, uptimeCount: 0 }
  );

  const avgUptime = stats.uptimeCount > 0 
    ? (stats.totalUptime / stats.uptimeCount).toFixed(2)
    : "100.00";

  // Calculate Growth (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const previousMonitorsCount = unifiedMonitors.filter(m => new Date(m.createdAt) < thirtyDaysAgo).length;
  const growth = previousMonitorsCount > 0 
    ? (((unifiedMonitors.length - previousMonitorsCount) / previousMonitorsCount) * 100).toFixed(1)
    : "0.0";

  const hasAnyMonitors = unifiedMonitors.length > 0;
  const totalCount = unifiedMonitors.length;
  const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase">Infrastructure</h1>
            <p className="text-mute text-xs font-mono">Real-time status of your global nodes.</p>
          </div>
          <div className="flex items-center gap-2">
            <CreateMonitorModal 
              workspaceId={userId} 
              trigger={
                <Button className="gap-1.5 eyebrow text-[10px] px-4 shadow-[0_0_10px_rgba(0,217,146,0.2)]">
                  <Plus className="size-3.5" />
                  <span>Provision Monitor</span>
                </Button>
              }
            />
          </div>
        </div>

        <section className="space-y-8">
          <PlanLimitBanner 
            current={totalCount} 
            max={limits.maxMonitors} 
            plan={user.plan} 
          />

          {/* Bento Stat Bar */}
          {hasAnyMonitors && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group relative flex flex-col p-4 bg-card border border-border rounded-md transition-all hover:border-primary">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="eyebrow text-[9px] text-mute">Global Status</span>
                    <span className={cn(
                      "display-md uppercase tracking-tight",
                      stats.down > 0 ? "text-destructive" : "text-primary"
                    )}>
                      {stats.down > 0 ? "Degraded" : "Optimal"}
                    </span>
                  </div>
                  <div className={cn(
                    "size-8 rounded-sm flex items-center justify-center transition-all group-hover:scale-110 border",
                    stats.down > 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    <Activity className="size-4" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-auto">
                  <div className={cn(
                    "size-1 rounded-full",
                    stats.down > 0 ? "bg-destructive animate-pulse" : "bg-primary"
                  )} />
                  <span className="text-[10px] text-mute font-mono uppercase">
                    {stats.down > 0 ? "Connectivity issues" : "All nodes reporting success"}
                  </span>
                </div>
              </div>

              <div className="group relative flex flex-col p-4 bg-card border border-border rounded-md transition-all hover:border-primary">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="eyebrow text-[9px] text-mute">Active Nodes</span>
                    <span className="display-md text-ink font-mono uppercase tracking-tight">
                      {totalCount} Units
                    </span>
                  </div>
                  <div className="size-8 rounded-sm bg-secondary text-mute border border-border flex items-center justify-center transition-all group-hover:scale-110 group-hover:text-primary-soft group-hover:border-primary/20">
                    <MonitorCheck className="size-4" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <div className={cn(
                    "flex items-center text-[9px] font-bold px-1 py-0.5 rounded-sm border uppercase tracking-tighter",
                    parseFloat(growth) >= 0 ? "text-primary border-primary/20 bg-primary/5" : "text-destructive border-destructive/20 bg-destructive/5"
                  )}>
                    <TrendingUp className={cn("size-2.5 mr-1", parseFloat(growth) < 0 && "rotate-180")} />
                    {parseFloat(growth) >= 0 ? `+${growth}%` : `${growth}%`}
                  </div>
                  <span className="text-[10px] text-mute font-mono uppercase">
                    vs last 30 days
                  </span>
                </div>
              </div>

              <div className="group relative flex flex-col p-4 bg-card border border-border rounded-md transition-all hover:border-primary">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="eyebrow text-[9px] text-mute">Avg. Reliability</span>
                    <span className="display-md text-ink font-mono uppercase tracking-tight">
                      {avgUptime}%
                    </span>
                  </div>
                  <div className="size-8 rounded-sm bg-secondary text-mute border border-border flex items-center justify-center transition-all group-hover:scale-110 group-hover:text-primary-soft group-hover:border-primary/20">
                    <Zap className="size-4" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-auto">
                   <div className="size-1 rounded-full bg-primary" />
                   <span className="text-[10px] text-mute font-mono uppercase">
                    Aggregated from 30D rollups
                  </span>
                </div>
              </div>
            </div>
          )}

          {!hasAnyMonitors ? (
            <TerminalEmptyState userId={userId} />
          ) : (
            <div className="space-y-4 pb-16">
              <div className="flex items-center justify-between">
                <h2 className="eyebrow text-mute opacity-60">Active Infrastructure</h2>
              </div>
              <MonitorTable monitors={unifiedMonitors} workspaceId={userId} baseUrl={baseUrl} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
