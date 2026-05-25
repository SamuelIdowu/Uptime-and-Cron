import { auth } from "@clerk/nextjs/server";
import { db, heartbeatMonitors, heartbeatPings } from "@steady-state/db";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MonitorTable } from "@/components/monitor-table";
import { Button } from "@/components/ui/button";
import { Plus, Heart } from "lucide-react";
import Link from "next/link";

import { CreateMonitorModal } from "@/components/create-monitor-modal";

export default async function HeartbeatsPage({
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
    redirect(`/${userId}/heartbeats`);
  }

  const userHeartbeats = await db.query.heartbeatMonitors.findMany({
    where: eq(heartbeatMonitors.userId, userId),
    orderBy: desc(heartbeatMonitors.createdAt),
    with: {
      pings: {
        orderBy: desc(heartbeatPings.receivedAt),
        limit: 20,
      },
    },
  });

  const unifiedMonitors = userHeartbeats.map(h => ({ ...h, type: 'heartbeat' as const }));

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase">Heartbeats</h1>
            <p className="text-mute text-xs font-mono">Cron jobs and background task monitoring.</p>
          </div>
          <CreateMonitorModal 
            workspaceId={userId}
            defaultType="heartbeat"
            trigger={
              <Button className="gap-1.5 eyebrow text-[10px] px-4 shadow-[0_0_10px_rgba(0,217,146,0.2)]">
                <Plus className="size-3.5" />
                <span>New Heartbeat</span>
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
