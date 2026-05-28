import { auth } from "@clerk/nextjs/server";
import { db, monitors, monitorChecks } from "@steady-state/db";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MonitorTable } from "@/components/monitor-table";
import { Button } from "@/components/ui/button";
import { Plus, MonitorCheck, Zap } from "lucide-react";
import Link from "next/link";

import { CreateMonitorModal } from "@/components/create-monitor-modal";

export default async function MonitorsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (userId !== workspaceId) {
    redirect(`/${userId}/monitors`);
  }

  const userMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
    orderBy: desc(monitors.createdAt),
    with: {
      checks: {
        orderBy: desc(monitorChecks.createdAt),
        limit: 20,
      },
      targets: true,
    },
  });

  const unifiedMonitors = userMonitors.map((m: any) => ({ ...m, type: 'http' as const }));

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase">HTTP Monitors</h1>
            <p className="text-mute text-xs font-mono">Website and API uptime surveillance.</p>
          </div>
          <CreateMonitorModal 
            workspaceId={userId}
            defaultType="http"
            trigger={
              <Button className="gap-1.5 eyebrow text-[10px] px-4 shadow-[0_0_10px_rgba(0,217,146,0.2)]">
                <Plus className="size-3.5" />
                <span>New HTTP Monitor</span>
              </Button>
            }
          />
        </div>

        <section>
          <MonitorTable monitors={unifiedMonitors} workspaceId={userId} />
        </section>
      </div>
    </main>
  );
}
