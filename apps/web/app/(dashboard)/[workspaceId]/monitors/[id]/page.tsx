import { auth } from "@clerk/nextjs/server";
import { db, monitors, monitorEvents, monitorChecks, monitorDailyAggregates } from "@steady-state/db";
import { and, eq, desc, gte } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Activity, Globe, Zap, Clock, Terminal, AlertTriangle, Settings2, ShieldCheck, RefreshCw, BarChart3, Map } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { StatusBadge } from "@/components/status-badge";
import { PingCalendar } from "@/components/ping-calendar";
import { UptimeBar, DailyStatus } from "@/components/uptime-bar";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { IncidentTable } from "@/components/incident-table";
import { RegionalPerformance, Region } from "@/components/regional-performance";
import { MonitorPageActions } from "@/components/monitor-page-actions";
import { formatDistanceToNow, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

export default async function MonitorDetailPage({
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

  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, id), eq(monitors.userId, userId)),
    with: {
      checks: {
        orderBy: desc(monitorChecks.createdAt),
        limit: 100,
      },
      events: {
        orderBy: desc(monitorEvents.startedAt),
        limit: 50,
      },
      dailyAggregates: {
        where: gte(monitorDailyAggregates.date, ninetyDaysAgo),
        orderBy: desc(monitorDailyAggregates.date),
      },
    },
  });

  if (!monitor) {
    notFound();
  }

  const events = monitor.events;
  const checks = monitor.checks;
  const rollups = monitor.dailyAggregates;

  // --- Aggregation Logic (90 Days for PingCalendar) ---
  const dailyHistory: number[] = [];
  const uptimeBarData: DailyStatus[] = [];

  for (let i = 89; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    // Check if we have a rollup for this day
    const rollup = rollups.find(r => isSameDay(new Date(r.date), day));
    
    let status: number;
    let barStatus: DailyStatus;

    if (rollup) {
      status = parseFloat(rollup.uptimePercentage) >= 100 ? 1 : rollup.failedChecks > 0 ? 0 : 1;
      barStatus = parseFloat(rollup.uptimePercentage) >= 100 ? "up" : "down";
    } else {
      // Fallback for today or missing data: use live events
      const dayEvents = events.filter((e) => {
        const start = new Date(e.startedAt);
        const end = e.resolvedAt ? new Date(e.resolvedAt) : new Date();
        return (
          (start >= dayStart && start <= dayEnd) ||
          (end >= dayStart && end <= dayEnd) ||
          (start < dayStart && end > dayEnd)
        );
      });

      if (dayEvents.some((e) => e.status === "down")) {
        status = 0;
        barStatus = "down";
      } else if (monitor.paused && monitor.lastCheckedAt && new Date(monitor.lastCheckedAt) < dayStart) {
        status = 0.5;
        barStatus = "paused";
      } else if (new Date(monitor.createdAt) > dayEnd) {
        status = 0; // Not created yet
        barStatus = "no-data";
      } else {
        status = 1;
        barStatus = "up";
      }
    }

    dailyHistory.push(status);
    if (i < 30) {
      uptimeBarData.push(barStatus);
    }
  }

  const uptime90d = dailyHistory.length > 0 
    ? (dailyHistory.reduce((acc, v) => acc + (v === 1 ? 1 : 0), 0) / dailyHistory.length * 100).toFixed(2)
    : "100.00";

  const responseTimeData = checks
    .filter(c => c.responseMs !== null)
    .map(c => ({
      time: formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }),
      value: c.responseMs || 0,
      isDown: c.status === "down"
    }))
    .reverse();

  const incidents = events
    .filter(e => e.status === "down")
    .map(e => ({
      id: e.id.slice(0, 8).toUpperCase(),
      title: e.errorMessage || `Outage detected`,
      status: e.resolvedAt ? "resolved" : "investigating" as any,
      severity: "critical" as any,
      createdAt: e.startedAt.toISOString(),
      service: "HTTP Monitor",
      updates: e.resolvedAt ? [{ time: e.resolvedAt.toISOString(), text: "System is back online." }] : []
    }));

  const currentStatus = monitor.paused ? "paused" : monitor.status;

  const regions: Region[] = [
    {
      id: "us-east-1",
      name: "Primary Node (US-East)",
      latency: monitor.avgResponseMs || 0,
      status: currentStatus === "up" ? "up" : currentStatus === "paused" ? "up" : "down"
    }
  ];

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
            <MonitorPageActions 
              monitorId={monitor.id} 
              workspaceId={workspaceId} 
              isPaused={monitor.paused ?? false} 
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
            <div className="flex items-start gap-5">
              <div className={cn(
                "size-14 rounded-md flex items-center justify-center ring-1",
                currentStatus === "up" ? "bg-primary/10 text-primary ring-primary/20" : 
                currentStatus === "down" ? "bg-destructive/10 text-destructive ring-destructive/20" :
                "bg-secondary text-mute ring-border"
              )}>
                <Globe className="size-6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="display-md text-inkStrong uppercase">{monitor.name}</h1>
                  <StatusBadge status={currentStatus} />
                </div>
                <div className="flex items-center gap-2 text-sm text-mute font-mono">
                  <span className="px-2 py-0.5 rounded-sm bg-secondary border border-border">{monitor.url}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-10 p-6 bg-card border border-border rounded-md">
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-[10px] text-mute">Avg. Response</span>
                <span className="text-xl font-bold text-ink font-mono tracking-tighter">{monitor.avgResponseMs ? `${monitor.avgResponseMs}ms` : "--ms"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-[10px] text-mute">90D Uptime</span>
                <span className="text-xl font-bold text-primary font-mono tracking-tighter">{uptime90d}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-[10px] text-mute">Last Checked</span>
                <span className="text-sm font-semibold text-inkStrong font-mono">
                   {monitor.lastCheckedAt 
                    ? formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Zone 2: ResponseTimeChart */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  Response Time Trend
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-secondary border border-border">
                  <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="eyebrow text-[9px] text-ink">Live Monitor</span>
                </div>
              </div>
              <div className="p-6 bg-card border border-border rounded-md">
                <ResponseTimeChart data={responseTimeData} className="h-[300px]" />
              </div>
            </section>

            {/* Zone 3: PingCalendar */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                  <Zap className="size-5 text-primary" />
                  Uptime History
                </h2>
                <div className="flex items-end gap-1.5">
                  <span className="text-2xl font-black text-primary tracking-tighter font-mono">{uptime90d}%</span>
                  <span className="eyebrow text-[9px] text-mute mb-1">Total</span>
                </div>
              </div>
              <div className="bg-card border border-border p-8 rounded-md space-y-8 overflow-x-auto">
                <UptimeBar data={uptimeBarData} />
                <div>
                  <PingCalendar data={dailyHistory} />
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-mute mt-6 opacity-60 font-mono">
                      <span>90 days ago</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-primary" /><span>Up</span></div>
                        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-destructive" /><span>Down</span></div>
                        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-border" /><span>No Data</span></div>
                      </div>
                      <span>Today</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-12">
            {/* Zone 4: Regional Performance */}
            <section className="space-y-6">
              <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                <Map className="size-5 text-primary" />
                Nodes
              </h2>
              <div className="bg-card border border-border rounded-md overflow-hidden">
                <RegionalPerformance regions={regions} />
              </div>
            </section>

            {/* Zone 5: Config Blocks */}
            <section className="space-y-6">
              <h2 className="display-sm text-inkStrong uppercase flex items-center gap-2">
                <Settings2 className="size-5 text-primary" />
                Config
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="group p-5 bg-card border border-border rounded-md transition-all hover:border-primary">
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="size-4 text-mute group-hover:text-primary transition-colors" />
                    <span className="eyebrow text-[10px] text-mute">Interval</span>
                  </div>
                  <span className="text-lg font-bold text-inkStrong font-mono">{monitor.intervalMinutes}m</span>
                </div>
                <div className="group p-5 bg-card border border-border rounded-md transition-all hover:border-primary">
                  <div className="flex items-center justify-between mb-3">
                    <ShieldCheck className="size-4 text-mute group-hover:text-primary transition-colors" />
                    <span className="eyebrow text-[10px] text-mute">SSL Policy</span>
                  </div>
                  <span className="text-lg font-bold text-inkStrong font-mono uppercase">{monitor.sslPolicy}</span>
                </div>
                <div className="group p-5 bg-card border border-border rounded-md transition-all hover:border-primary">
                  <div className="flex items-center justify-between mb-3">
                    <RefreshCw className="size-4 text-mute group-hover:text-primary transition-colors" />
                    <span className="eyebrow text-[10px] text-mute">Auto Retry</span>
                  </div>
                  <span className="text-lg font-bold text-inkStrong font-mono">{monitor.autoRetry} ATTEMPTS</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Zone 6: IncidentTable */}
        <section className="space-y-8 pb-20">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="display-sm text-inkStrong uppercase flex items-center gap-3">
              <AlertTriangle className="size-6 text-destructive" />
              Incident History
            </h2>
            <Button variant="ghost" size="sm" className="eyebrow text-[10px]">View Full Logs</Button>
          </div>
          <IncidentTable data={incidents} />
        </section>
      </div>
    </main>
  );
}
