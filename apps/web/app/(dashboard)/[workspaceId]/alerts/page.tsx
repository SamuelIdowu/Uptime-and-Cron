import { auth } from "@clerk/nextjs/server";
import { db, alerts } from "@steady-state/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { AlertLogTable } from "@/components/alert-log-table";

export default async function AlertsPage({
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
    redirect(`/${userId}/alerts`);
  }

  const userAlerts = await db.query.alerts.findMany({
    where: eq(alerts.userId, userId),
    orderBy: desc(alerts.createdAt),
    with: {
      monitor: true,
      heartbeat: true,
    },
    limit: 50,
  });

  const formattedAlerts = userAlerts.map(a => ({
    id: a.id.slice(0, 8).toUpperCase(),
    monitor: a.monitor?.name || a.heartbeat?.name || "Unknown",
    type: a.type.toUpperCase(),
    time: a.createdAt.toISOString(),
    channel: a.channel.charAt(0).toUpperCase() + a.channel.slice(1),
    status: a.status
  }));

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <Bell className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alert Deliveries</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            A comprehensive log of all notifications dispatched to your configured channels (Email, Slack, Telegram).
          </p>
        </header>

        {/* Alert Log Table */}
        <section>
          <AlertLogTable data={formattedAlerts as any} />
        </section>
      </div>
    </main>
  );
}
