import { auth } from "@clerk/nextjs/server";
import { db, heartbeatMonitors, heartbeatPings } from "@steady-state/db";
import { and, eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Activity, Clock, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { CopyField } from "@/components/copy-field";
import { formatDistanceToNow } from "date-fns";

export default async function HeartbeatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const heartbeat = await db.query.heartbeatMonitors.findFirst({
    where: and(eq(heartbeatMonitors.id, id), eq(heartbeatMonitors.userId, userId)),
  });

  if (!heartbeat) {
    notFound();
  }

  const pings = await db
    .select()
    .from(heartbeatPings)
    .where(eq(heartbeatPings.heartbeatId, heartbeat.id))
    .orderBy(desc(heartbeatPings.receivedAt))
    .limit(10);

  const pingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ping/${heartbeat.pingToken}`;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
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
              <StatusDot status={heartbeat.paused ? "paused" : heartbeat.status} size="lg" />
              <h1 className="text-2xl font-semibold tracking-tight">{heartbeat.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Status:</span>
              <span className="text-foreground uppercase">{heartbeat.status}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Expected:</span>
              <span className="text-foreground">Every {heartbeat.periodMinutes}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Grace:</span>
              <span className="text-foreground">{heartbeat.graceMinutes}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-widest">Last Ping:</span>
              <span className="text-foreground">
                {heartbeat.lastPingAt 
                  ? formatDistanceToNow(new Date(heartbeat.lastPingAt), { addSuffix: true })
                  : "Never"}
              </span>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="bg-card border rounded-xl p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Your Unique Ping URL
              </h2>
              <p className="text-sm text-muted-foreground">
                Send a GET or POST request to this URL at the end of your script or cron job.
              </p>
            </div>

            <CopyField value={pingUrl} />

            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Example Usage (cURL)
              </p>
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm group relative">
                <code className="text-primary">
                  curl --retry 3 {pingUrl}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Terminal className="size-4" />
              Recent Ping History
            </h2>
            
            <div className="border rounded-lg overflow-hidden bg-card">
              {pings.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No pings received yet. Run your job to send the first one.
                </div>
              ) : (
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">Received At</th>
                      <th className="text-left px-4 py-2 font-medium">Source IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pings.map((ping) => (
                      <tr key={ping.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          {new Date(ping.receivedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ping.sourceIp}
                        </td>
                      </tr>
                    ))}
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
