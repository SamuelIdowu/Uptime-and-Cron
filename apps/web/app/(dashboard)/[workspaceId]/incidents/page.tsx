import { auth } from "@clerk/nextjs/server";
import { db, monitorEvents, monitors } from "@steady-state/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { IncidentTable } from "@/components/incident-table";

export default async function IncidentsPage({
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
    redirect(`/${userId}/incidents`);
  }

  const userMonitors = await db.select({ id: monitors.id }).from(monitors).where(eq(monitors.userId, userId));
  const monitorIds = userMonitors.map((m: any) => m.id);

  let incidents: any[] = [];

  if (monitorIds.length > 0) {
    const events = await db.query.monitorEvents.findMany({
      where: and(
        inArray(monitorEvents.monitorId, monitorIds),
        eq(monitorEvents.status, "down")
      ),
      orderBy: desc(monitorEvents.startedAt),
      with: {
        monitor: true
      },
      limit: 50
    });

    incidents = events.map((e: any) => ({
      id: e.id.slice(0, 8).toUpperCase(),
      title: e.errorMessage || `Outage detected on ${e.monitor.name}`,
      status: e.resolvedAt ? "resolved" : "investigating",
      severity: "critical",
      createdAt: e.startedAt.toISOString(),
      service: e.monitor.name,
      updates: e.resolvedAt ? [{ time: e.resolvedAt.toISOString(), text: "System is back online." }] : []
    }));
  }

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase">Incident History</h1>
            <p className="text-mute text-xs font-mono">Comprehensive log of degraded performance and outages.</p>
          </div>
        </div>

        {/* Incident Table */}
        <section>
          <IncidentTable data={incidents as any} />
        </section>
      </div>
    </main>
  );
}
