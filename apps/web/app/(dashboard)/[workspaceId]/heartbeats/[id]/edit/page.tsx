import { auth } from "@clerk/nextjs/server";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { HeartbeatForm } from "@/components/heartbeat-form";
import { Button } from "@/components/ui/button";
import { db, heartbeatMonitors } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function EditHeartbeatPage({
  params,
}: {
  params: Promise<{ id: string, workspaceId: string }>;
}) {
  const { id, workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const heartbeat = await db.query.heartbeatMonitors.findFirst({
    where: and(eq(heartbeatMonitors.id, id), eq(heartbeatMonitors.userId, userId)),
  });

  if (!heartbeat) {
    notFound();
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href={`/${workspaceId}/heartbeats/${id}`}>
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground font-mono uppercase text-xs tracking-wider">
                <ArrowLeft className="size-4" />
                [Back]
              </Button>
            </Link>
            <Activity className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight uppercase">Edit Heartbeat Monitor</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Update your cron job ping settings.
            </p>
          </div>
        </header>

        <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <HeartbeatForm initialData={heartbeat} />
        </section>
      </div>
    </main>
  );
}
