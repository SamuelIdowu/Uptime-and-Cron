import { auth } from "@clerk/nextjs/server";
import { db, monitors, monitorEvents } from "@steady-state/db";
import { and, eq, desc, gte } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Activity, Globe, Zap, Clock, Terminal, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { UptimeBar, DailyStatus } from "@/components/uptime-bar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, id), eq(monitors.userId, userId)),
  });

  if (!monitor) {
    notFound();
  }

  const thirtyDaysAgo = subDays(new Date(), 30);
  const events = await db
    .select()
    .from(monitorEvents)
    .where(and(eq(monitorEvents.monitorId, monitor.id), gte(monitorEvents.startedAt, thirtyDaysAgo)))
    .orderBy(desc(monitorEvents.startedAt));

  // --- Aggregation Logic ---
  const dailyHistory: DailyStatus[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const dayEvents = events.filter((e) => {
      const start = new Date(e.startedAt);
      const end = e.resolvedAt ? new Date(e.resolvedAt) : new Date();
      return (
        isWithinInterval(start, { start: dayStart, end: dayEnd }) ||
        isWithinInterval(end, { start: dayStart, end: dayEnd }) ||
        (start < dayStart && end > dayEnd)
      );
    });

    if (dayEvents.some((e) => e.status === "down")) {
      dailyHistory.push("down");
    } else if (monitor.paused && monitor.lastCheckedAt && new Date(monitor.lastCheckedAt) < dayStart) {
        // Simple heuristic for paused state in history
        dailyHistory.push("paused");
    } else {
      dailyHistory.push("up");
    }
  }

  // Calculate Uptime (simplified for MVP: based on count of down events)
  const downEvents = events.filter(e => e.status === 'down');
  const totalDownTimeMs = downEvents.reduce((acc, e) => {
      const start = new Date(e.startedAt).getTime();
      const end = e.resolvedAt ? new Date(e.resolvedAt).getTime() : Date.now();
      return acc + (end - start);
  }, 0);

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const uptime30d = Math.max(0, Math.min(100, 100 - (totalDownTimeMs / thirtyDaysMs) * 100)).toFixed(2);

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Button>
            </Link>
            <Activity className="size-6 text-primary" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <StatusDot status={monitor.paused ? "paused" : monitor.status} size="lg" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-semibold tracking-tight">{monitor.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <Globe className="size-3" />
                  {monitor.url}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                {monitor.paused ? "Resume" : "Pause"}
              </Button>
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Status:</span>
              <Badge variant={monitor.status === 'up' ? 'default' : 'destructive'} className="rounded-sm uppercase h-5 text-[10px]">
                {monitor.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Response:</span>
              <span className="text-foreground">{monitor.avgResponseMs ? `${monitor.avgResponseMs}ms` : "--ms"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Last Check:</span>
              <span className="text-foreground">
                {monitor.lastCheckedAt 
                  ? formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })
                  : "Never"}
              </span>
            </div>
          </div>
        </header>

        <section className="space-y-12">
          {/* Metrics Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="size-4" />
                Uptime (30 Days)
              </h2>
              <span className="text-xl font-semibold text-primary font-mono">{uptime30d}%</span>
            </div>
            <div className="bg-card border rounded-xl p-8 space-y-4 shadow-sm">
                <UptimeBar data={dailyHistory} />
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>30 days ago</span>
                    <span>Today</span>
                </div>
            </div>
          </div>

          {/* Incident History */}
          <div className="space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Terminal className="size-4" />
              Incident Log
            </h2>
            
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              {events.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground italic">
                  No incidents recorded. System is stable.
                </div>
              ) : (
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">Event</th>
                      <th className="text-left px-4 py-2 font-medium">Started At</th>
                      <th className="text-left px-4 py-2 font-medium">Duration</th>
                      <th className="text-right px-4 py-2 font-medium">HTTP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                        const durationMs = event.resolvedAt 
                            ? new Date(event.resolvedAt).getTime() - new Date(event.startedAt).getTime()
                            : null;
                        
                        const formatDuration = (ms: number | null) => {
                            if (ms === null) return "Ongoing";
                            const mins = Math.floor(ms / 60000);
                            const secs = Math.floor((ms % 60000) / 1000);
                            return `${mins}m ${secs}s`;
                        }

                        return (
                            <tr key={event.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                    <Badge variant={event.status === 'up' ? 'outline' : 'destructive'} className="rounded-sm uppercase text-[9px] h-4">
                                        {event.status === 'up' ? 'Recovered' : 'Downtime'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {new Date(event.startedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    {formatDuration(durationMs)}
                                </td>
                                <td className="px-4 py-3 text-right text-muted-foreground">
                                    {event.httpStatus || "---"}
                                </td>
                            </tr>
                        );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
