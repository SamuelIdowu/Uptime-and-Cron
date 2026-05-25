import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { db, monitors, heartbeatMonitors, users, alertSettings } from "@steady-state/db";
import { desc, eq } from "drizzle-orm";
import { MonitorCard } from "@/components/monitor-card";
import { HeartbeatCard } from "@/components/heartbeat-card";
import { PlanLimitBanner } from "@/components/plan-limit-banner";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Zap, Heart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLAN_LIMITS } from "@/lib/constants";

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // --- Auto-Sync Hack for Development ---
  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      // Create user and default alert settings in a transaction
      await db.transaction(async (tx) => {
        const newUser = await tx.insert(users).values({
          id: userId,
          email: email || "unknown@example.com",
          plan: "free",
        }).returning();
        
        user = newUser[0];

        await tx.insert(alertSettings).values({
          userId: userId,
          email: email || "unknown@example.com",
        });
      });
      
      console.log(`[Auto-Sync] Created local record for user: ${userId}`);
    } else {
      redirect("/sign-up");
    }
  }

  const [userMonitors, userHeartbeats] = await Promise.all([
    db
      .select()
      .from(monitors)
      .where(eq(monitors.userId, userId))
      .orderBy(desc(monitors.createdAt)),
    db
      .select()
      .from(heartbeatMonitors)
      .where(eq(heartbeatMonitors.userId, userId))
      .orderBy(desc(heartbeatMonitors.createdAt)),
  ]);
  // ---------------------------------------

  const stats = [...userMonitors, ...userHeartbeats].reduce(
    (acc, m) => {
      if (m.paused) acc.paused++;
      else if (m.status === "up") acc.up++;
      else if (m.status === "down" || m.status === "late") acc.down++;
      return acc;
    },
    { up: 0, down: 0, paused: 0 }
  );

  const hasAnyMonitors = userMonitors.length > 0 || userHeartbeats.length > 0;
  const totalCount = userMonitors.length + userHeartbeats.length;
  const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="size-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">SteadyState</h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">New Monitor</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/monitors/new">
                  <DropdownMenuItem className="cursor-pointer">
                    <Zap className="size-4 mr-2" /> HTTP Monitor
                  </DropdownMenuItem>
                </Link>
                <Link href="/heartbeats/new">
                  <DropdownMenuItem className="cursor-pointer">
                    <Heart className="size-4 mr-2" /> Heartbeat (Cron)
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <section className="space-y-12">
          <PlanLimitBanner 
            current={totalCount} 
            max={limits.maxMonitors} 
            plan={user.plan} 
          />

          {/* Summary Bar */}
          {hasAnyMonitors && (
            <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-muted-foreground border-b pb-4">
              <span className={stats.up > 0 ? "text-primary" : ""}>
                {stats.up} UP
              </span>
              <span>·</span>
              <span className={stats.down > 0 ? "text-destructive" : ""}>
                {stats.down} DOWN/LATE
              </span>
              <span>·</span>
              <span>{stats.paused} PAUSED</span>
            </div>
          )}

          {!hasAnyMonitors ? (
            <div className="p-16 border border-dashed rounded-lg flex flex-col items-center justify-center text-center space-y-6">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Nothing to watch yet.</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Add an HTTP monitor to start tracking uptime, or create a heartbeat to watch your cron jobs.
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/monitors/new">
                  <Button variant="outline" className="gap-2">
                    <Zap className="size-4" />
                    Add HTTP Monitor
                  </Button>
                </Link>
                <Link href="/heartbeats/new">
                  <Button variant="outline" className="gap-2">
                    <Heart className="size-4" />
                    Add Heartbeat
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* HTTP Monitors */}
              {userMonitors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                      HTTP Monitors ({userMonitors.length})
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {userMonitors.map((monitor) => (
                      <MonitorCard key={monitor.id} monitor={monitor} />
                    ))}
                  </div>
                </div>
              )}

              {/* Heartbeat Monitors */}
              {userHeartbeats.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                      Heartbeat Monitors ({userHeartbeats.length})
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {userHeartbeats.map((heartbeat) => (
                      <HeartbeatCard key={heartbeat.id} heartbeat={heartbeat} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
