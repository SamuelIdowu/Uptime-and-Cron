import { db, statusPages, monitorEvents, monitorDailyAggregates } from "@steady-state/db";
import { eq, gte, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Activity, ShieldCheck, Globe, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { UptimeBar } from "@/components/uptime-bar";
import { subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateUptimeBarData } from "@/lib/utils/uptime";

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const thirtyDaysAgo = subDays(new Date(), 30);

  const page = await db.query.statusPages.findFirst({
    where: eq(statusPages.slug, slug),
    with: {
      monitors: {
        with: {
          monitor: {
            with: {
              events: {
                where: gte(monitorEvents.startedAt, thirtyDaysAgo),
                orderBy: desc(monitorEvents.startedAt),
              },
              dailyAggregates: {
                where: gte(monitorDailyAggregates.date, thirtyDaysAgo),
                orderBy: desc(monitorDailyAggregates.date),
              },
            },
          },
        },
        orderBy: (spm, { asc }) => [asc(spm.order)],
      },
    },
  });

  if (!page || !page.published) {
    notFound();
  }

  const allUp = page.monitors.every(m => m.monitor.status === "up");
  const someDown = page.monitors.some(m => m.monitor.status === "down");

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black font-sans selection:bg-primary selection:text-black">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
          <div className="space-y-4">
            {page.logoUrl && (
              <img src={page.logoUrl} alt={page.name} className="h-10 w-auto object-contain" />
            )}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-inkStrong uppercase">{page.name}</h1>
              {page.description && (
                <p className="text-mute text-sm max-w-lg leading-relaxed font-mono">{page.description}</p>
              )}
            </div>
          </div>

          <div className={cn(
            "px-6 py-4 rounded-md border flex items-center gap-4 transition-all duration-500",
            allUp ? "bg-primary/5 border-primary/20 text-primary shadow-[0_0_20px_rgba(0,217,146,0.05)]" :
            someDown ? "bg-destructive/5 border-destructive/20 text-destructive" :
            "bg-secondary border-border text-mute"
          )}>
            {allUp ? <CheckCircle2 className="size-6 animate-pulse" /> : <AlertCircle className="size-6" />}
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">Current Status</span>
              <span className="text-lg font-bold uppercase tracking-tight">
                {allUp ? "All Systems Operational" : someDown ? "Partial System Outage" : "Systems Unstable"}
              </span>
            </div>
          </div>
        </header>

        {/* Monitors */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-mute flex items-center gap-2">
              <Activity className="size-3.5 text-primary" />
              Service Status
            </h2>
            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-mute/50">
              <div className="flex items-center gap-1.5"><div className="size-1.5 rounded-full bg-primary" /> Up</div>
              <div className="flex items-center gap-1.5"><div className="size-1.5 rounded-full bg-destructive" /> Down</div>
              <div className="flex items-center gap-1.5"><div className="size-1.5 rounded-full bg-border" /> No Data</div>
            </div>
          </div>

          <div className="grid gap-6">
            {page.monitors.map(({ monitor }) => {
              const uptimeBarData = calculateUptimeBarData(
                monitor.createdAt,
                monitor.lastCheckedAt,
                monitor.paused,
                monitor.events,
                monitor.dailyAggregates,
                30
              );

              return (
                <div 
                  key={monitor.id}
                  className="group space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                          "size-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-all duration-500",
                          monitor.status === "up" ? "bg-primary shadow-primary/20" : 
                          monitor.status === "down" ? "bg-destructive shadow-destructive/20" : 
                          "bg-secondary"
                      )} />
                      <div className="flex flex-col">
                        <span className="font-bold text-inkStrong tracking-tight uppercase group-hover:text-primary transition-colors">
                          {monitor.name}
                        </span>
                        <span className="text-[10px] text-mute font-mono uppercase tracking-tighter">
                          {monitor.url ? new URL(monitor.url).hostname : "Internal Node"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-end sm:self-auto">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-mute/40">Uptime 30d</span>
                        <span className="text-sm font-bold font-mono text-ink">
                          {monitor.uptime30d ? `${monitor.uptime30d}%` : "100.00%"}
                        </span>
                      </div>
                      <StatusBadge status={monitor.status} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <UptimeBar data={uptimeBarData} className="h-10 gap-[3px]" />
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-[0.1em] text-mute/40 font-mono">
                      <span>30 days ago</span>
                      <div className="h-px flex-1 border-t border-border/40 mx-4 self-center" />
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-20 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <div className="flex items-center gap-3">
            <Globe className="size-4 text-mute" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mute">
              Global Network Monitoring Active
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-mute">
            Powered by <span className="text-primary tracking-tighter">SteadyState</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
