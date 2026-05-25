import { auth } from "@clerk/nextjs/server";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MonitorForm } from "@/components/monitor-form";
import { Button } from "@/components/ui/button";

export default async function NewMonitorPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href={`/${workspaceId}/dashboard`}>
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground font-mono uppercase text-xs tracking-wider">
                <ArrowLeft className="size-4" />
                [Back]
              </Button>
            </Link>
            <Activity className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight uppercase">Create HTTP Monitor</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Configure a new endpoint to monitor for uptime and performance.
            </p>
          </div>
        </header>

        <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <MonitorForm />
        </section>
      </div>
    </main>
  );
}
