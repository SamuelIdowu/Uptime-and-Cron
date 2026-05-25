import { auth } from "@clerk/nextjs/server";
import { db, heartbeatMonitors, heartbeatPings, heartbeatDailyAggregates, users } from "@steady-state/db";
import { and, eq, desc, gte } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Activity, Clock, ShieldCheck, Terminal, Heart, Settings2, Zap, BarChart3, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { StatusBadge } from "@/components/status-badge";
import { CopyField } from "@/components/copy-field";
import { CopyButton } from "@/components/copy-button";
import { IntegrationSnippet } from "@/components/integration-snippet";
import { PingCalendar } from "@/components/ping-calendar";
import { UptimeBar, DailyStatus } from "@/components/uptime-bar";
import { PingTimingChart } from "@/components/ping-timing-chart";
import { formatDistanceToNow, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { HeartbeatPageActions } from "@/components/heartbeat-page-actions";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";

export default async function HeartbeatDetailPage({
  params,
}: {
  params: Promise<{ id: string, workspaceId: string }>;
}) {
  const { id, workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const ninetyDaysAgo = subDays(new Date(), 90);

  const [heartbeat, user] = await Promise.all([
    db.query.heartbeatMonitors.findFirst({
      where: and(eq(heartbeatMonitors.id, id), eq(heartbeatMonitors.userId, userId)),
      with: {
        dailyAggregates: {
          where: gte(heartbeatDailyAggregates.date, ninetyDaysAgo),
          orderBy: desc(heartbeatDailyAggregates.date),
        },
      },
    }),
    db.query.users.findFirst({
      where: eq(users.id, userId),
    })
  ]);

  if (!heartbeat) {
    notFound();
  }

  const allPings = await db
    .select()
    .from(heartbeatPings)
    .where(and(eq(heartbeatPings.heartbeatId, heartbeat.id), gte(heartbeatPings.receivedAt, ninetyDaysAgo)))
    .orderBy(desc(heartbeatPings.receivedAt));

  const rollups = heartbeat.dailyAggregates;

  // Robust URL detection
  const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = user?.appUrl || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const pingUrl = `${baseUrl}/api/ping/${heartbeat.pingToken}`;

  const currentStatus = heartbeat.paused ? "paused" : heartbeat.status;

  // Real aggregation for 90 days using rollups
  const dailyHistory: number[] = [];
  const uptimeBarData: DailyStatus[] = [];

  for (let i = 89; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const rollup = rollups.find(r => isSameDay(new Date(r.date), day));
    
    let status: number;
    let barStatus: DailyStatus;

    if (rollup) {
      status = parseFloat(rollup.uptimePercentage) >= 100 ? 1 : 0;
      barStatus = parseFloat(rollup.uptimePercentage) >= 100 ? "up" : "down";
    } else {
      // Fallback for today or missing data
      const dayPings = allPings.filter(p => p.receivedAt >= dayStart && p.receivedAt <= dayEnd);
      
      if (dayPings.length > 0) {
        status = 1;
        barStatus = "up";
      } else if (heartbeat.paused && heartbeat.lastPingAt && new Date(heartbeat.lastPingAt) < dayStart) {
        status = 0.5;
        barStatus = "paused";
      } else if (new Date(heartbeat.createdAt) > dayEnd) {
        status = 0; // Not created yet
        barStatus = "no-data";
      } else {
        status = 0; // Missed day
        barStatus = "down";
      }
    }

    dailyHistory.push(status);
    if (i < 30) {
      uptimeBarData.push(barStatus);
    }
  }

  const pingTimingData = allPings
    .slice(0, 50)
    .map((p, i, arr) => {
      const prevPing = arr[i + 1];
      let delayMs = 0;
      if (prevPing) {
        const diff = p.receivedAt.getTime() - prevPing.receivedAt.getTime();
        delayMs = diff - (heartbeat.periodMinutes * 60 * 1000);
      }
      return {
        time: formatDistanceToNow(new Date(p.receivedAt), { addSuffix: true }),
        delayMs: Math.round(delayMs / 1000), 
        status: (p.exitCode === 0 || p.exitCode === null) ? "up" : "down" as any
      };
    })
    .reverse();

  const uptime90d = dailyHistory.length > 0
    ? (dailyHistory.reduce((acc, v) => acc + (v === 1 ? 1 : 0), 0) / dailyHistory.length * 100).toFixed(2)
    : "100.00";

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Zone 1: Header/Status */}
        <header className="space-y-8">
          <div className="flex items-center justify-between">
            <Link href={`/${workspaceId}/dashboard`}>
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-mute hover:text-ink transition-colors">
                <ArrowLeft className="size-4" />
                <span className="eyebrow text-[10px]">Back to Dashboard</span>
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <HeartbeatPageActions 
                heartbeatId={heartbeat.id} 
                workspaceId={workspaceId} 
                isPaused={heartbeat.paused} 
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
            <div className="flex items-start gap-5">
              <div className={cn(
                "size-14 rounded-md flex items-center justify-center ring-1",
                currentStatus === "up" ? "bg-primary/10 text-primary ring-primary/20" : 
                currentStatus === "down" ? "bg-destructive/10 text-destructive ring-destructive/20" :
                "bg-secondary text-mute ring-border"
              )}>
                <Heart className="size-6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="display-md text-inkStrong uppercase tracking-tight">{heartbeat.name}</h1>
                  <StatusBadge status={currentStatus} />
                </div>
                <div className="flex items-center gap-2 text-sm text-mute font-mono">
                  <Clock className="size-3.5 text-primary-soft" />
                  <span className="uppercase tracking-tight">Period: {heartbeat.periodMinutes}m</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-10 p-6 bg-card border border-border rounded-md">
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-[10px] text-mute">Grace Period</span>
                <span className="text-xl font-bold text-ink font-mono tracking-tighter">{heartbeat.graceMinutes}m</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-[10px] text-mute">90D Success</span>
                <span className="text-xl font-bold text-primary font-mono tracking-tighter">{uptime90d}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-[10px] text-mute">Last Check-in</span>
                <span className="text-sm font-semibold text-inkStrong font-mono">
                   {heartbeat.lastPingAt 
                    ? formatDistanceToNow(new Date(heartbeat.lastPingAt), { addSuffix: true })
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Zone 2: PingTimingChart */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  Timing Deviation
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-secondary border border-border">
                  <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,217,146,0.5)]" />
                  <span className="eyebrow text-[9px] text-ink">Seconds from baseline</span>
                </div>
              </div>
              <div className="p-6 bg-card border border-border rounded-md">
                <PingTimingChart data={pingTimingData} />
              </div>
            </section>

            {/* Zone 3: PingCalendar */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                  <Zap className="size-5 text-primary" />
                  Reliability History
                </h2>
              </div>
              <div className="bg-card border border-border p-8 rounded-md space-y-8 overflow-x-auto">
                <UptimeBar data={uptimeBarData} />
                <div>
                  <PingCalendar data={dailyHistory} />
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-mute mt-6 opacity-60 font-mono">
                      <span>90 days ago</span>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-primary" /><span>OK</span></div>
                        <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-destructive" /><span>Missed</span></div>
                        <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-border" /><span>Pending</span></div>
                      </div>
                      <span>Today</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-12">
            {/* Zone 4: Integration */}
            <section className="space-y-6">
              <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Integration
              </h2>
              <div className="bg-card border border-border p-6 rounded-md space-y-6">
                <div className="space-y-3">
                  <p className="eyebrow text-[10px] text-mute">Unique Endpoint</p>
                  <CopyField value={pingUrl} />
                </div>

                <IntegrationSnippet url={pingUrl} />
              </div>
            </section>

            {/* Zone 5: Quick Stats */}
            <section className="space-y-6">
               <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                <Settings2 className="size-5 text-primary" />
                Settings
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="group p-5 bg-card border border-border rounded-md transition-all hover:border-primary">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="size-4 text-mute group-hover:text-primary transition-colors" />
                    <span className="eyebrow text-[10px] text-mute">Period</span>
                  </div>
                  <p className="text-lg font-bold text-inkStrong font-mono">{heartbeat.periodMinutes}m</p>
                </div>
                <div className="group p-5 bg-card border border-border rounded-md transition-all hover:border-primary">
                  <div className="flex items-center justify-between mb-2">
                    <Terminal className="size-4 text-mute group-hover:text-primary transition-colors" />
                    <span className="eyebrow text-[10px] text-mute">Grace</span>
                  </div>
                  <p className="text-lg font-bold text-inkStrong font-mono">{heartbeat.graceMinutes}m</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Zone 6: Ping Log */}
        <section className="space-y-8 pb-20">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="display-sm text-inkStrong uppercase flex items-center gap-3">
              <History className="size-6 text-primary" />
              Check-in History
            </h2>
            <Button variant="ghost" size="sm" className="eyebrow text-[10px]">Export Logs</Button>
          </div>
          <div className="bg-background border border-border rounded-md overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/30 border-b border-border eyebrow text-[10px] text-mute">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {allPings.slice(0, 20).map((ping) => (
                  <tr key={ping.id} className="hover:bg-secondary/50 transition-colors cursor-pointer">
                    <td className="px-6 py-5 text-sm font-bold text-ink font-mono tracking-tight">
                      {new Date(ping.receivedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge status={(ping.exitCode === 0 || ping.exitCode === null) ? "up" : "down"}>
                        {(ping.exitCode === 0 || ping.exitCode === null) ? "Success" : "Failed"}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-5 text-sm text-mute font-mono">
                      {ping.durationMs ? `${ping.durationMs}ms` : "-"}
                    </td>
                    <td className="px-6 py-5 font-mono text-[11px] text-mute text-right uppercase tracking-tighter">
                      {ping.sourceIp || "Internal Node"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
