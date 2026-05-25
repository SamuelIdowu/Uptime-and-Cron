import { auth } from "@clerk/nextjs/server";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { HeartbeatForm } from "@/components/heartbeat-form";
import { Button } from "@/components/ui/button";

export default async function NewHeartbeatPage({
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
            <h1 className="text-xl font-semibold tracking-tight uppercase">Create Heartbeat Monitor</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Monitor your cron jobs and background tasks by having them ping a unique URL.
            </p>
          </div>
        </header>

        <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <HeartbeatForm />
        </section>
      </div>
    </main>
  );
}
