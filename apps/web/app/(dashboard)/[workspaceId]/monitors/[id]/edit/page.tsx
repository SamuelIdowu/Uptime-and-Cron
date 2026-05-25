import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Server } from "lucide-react";
import Link from "next/link";
import { MonitorForm } from "@/components/monitor-form";
import { Button } from "@/components/ui/button";
import { db, monitors } from "@steady-state/db";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string, workspaceId: string }>;
}) {
  const { id, workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, id), eq(monitors.userId, userId)),
  });

  if (!monitor) {
    notFound();
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href={`/${workspaceId}/monitors/${id}`}>
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground font-mono uppercase text-xs tracking-wider">
                <ArrowLeft className="size-4" />
                [Back]
              </Button>
            </Link>
            <Server className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight uppercase">Edit HTTP Monitor</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Update your endpoint monitoring settings.
            </p>
          </div>
        </header>

        <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <MonitorForm initialData={monitor} />
        </section>
      </div>
    </main>
  );
}
