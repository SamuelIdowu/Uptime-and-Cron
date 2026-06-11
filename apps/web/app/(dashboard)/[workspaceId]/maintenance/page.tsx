import { auth } from "@clerk/nextjs/server";
import { db, maintenanceWindows, monitors, heartbeatMonitors } from "@steady-state/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Wrench } from "lucide-react";
import { MaintenanceTable } from "@/components/maintenance-table";
import { CreateMaintenanceModal } from "@/components/create-maintenance-modal";

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Security check: ensure workspaceId matches userId
  if (userId !== workspaceId) {
    redirect(`/${userId}/maintenance`);
  }

  // 1. Fetch maintenance windows
  const windows = await db.query.maintenanceWindows.findMany({
    where: and(
      eq(maintenanceWindows.userId, userId),
      gte(maintenanceWindows.endTime, new Date())
    ),
    orderBy: desc(maintenanceWindows.startTime),
    with: {
      monitor: true,
      heartbeat: true,
    },
  });

  // 2. Fetch monitors and heartbeats for the creation modal
  const userMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
    orderBy: desc(monitors.createdAt),
  });

  const userHeartbeats = await db.query.heartbeatMonitors.findMany({
    where: eq(heartbeatMonitors.userId, userId),
    orderBy: desc(heartbeatMonitors.createdAt),
  });

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase flex items-center gap-2">
              <Wrench className="size-6 text-primary" />
              Maintenance
            </h1>
            <p className="text-mute text-xs font-mono">Schedule planned system dormancy and silence alerts.</p>
          </div>
          <CreateMaintenanceModal 
            monitors={userMonitors}
            heartbeats={userHeartbeats}
            trigger={
              <Button className="gap-1.5 eyebrow text-[10px] px-4 shadow-[0_0_10px_rgba(0,217,146,0.2)]">
                <Plus className="size-3.5" />
                <span>Schedule Window</span>
              </Button>
            }
          />
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="eyebrow text-[10px] text-mute uppercase tracking-widest">Active & Upcoming Schedules</span>
            <div className="h-[1px] flex-1 bg-border/40" />
          </div>
          <MaintenanceTable windows={windows} workspaceId={userId} />
        </section>

        <section className="bg-secondary/20 border border-border rounded-md p-6">
          <h2 className="eyebrow text-[11px] text-inkStrong uppercase mb-2">Protocol Note</h2>
          <p className="text-xs text-mute font-mono leading-relaxed max-w-2xl">
            When a maintenance window is active, SteadyState will continue to record checks but will NOT 
            trigger any notification channels. Status pages will display a "Maintenance" badge for affected monitors.
            Global windows affect all infrastructure associated with this workspace.
          </p>
        </section>
      </div>
    </main>
  );
}
