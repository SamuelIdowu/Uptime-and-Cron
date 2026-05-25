import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Activity, Zap, Heart, Bell, ShieldCheck, Terminal, ArrowRight, Github } from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect(`/${userId}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <span className="font-semibold text-base tracking-tight">SteadyState</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-medium">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-medium border-primary/30 text-primary">
            v1.0 Early Access
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground balance leading-[1.1]">
            Industrial-grade monitoring for <br className="hidden sm:block" />
            <span className="text-primary italic">solo developers.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Stop worrying about downtime. Robust HTTP checks and cron job heartbeats 
            with instant alerts via Slack and Email.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-10 px-6 text-sm gap-2 group">
                Start Monitoring Free
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-10 px-6 text-sm gap-2">
              <Github className="size-3.5" />
              View Source
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-card/30 border-y border-border/50 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* HTTP Monitoring */}
          <div className="p-6 bg-background border rounded-lg space-y-3 hover:border-primary/50 transition-colors">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="size-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">HTTP Uptime</h3>
            <p className="text-xs text-muted-foreground font-sans">
              High-frequency polling for your APIs and web apps. Customize status codes and intervals down to 1 minute.
            </p>
            <div className="pt-2 flex gap-1.5">
                <Badge variant="secondary" className="text-[10px]">Axios</Badge>
                <Badge variant="secondary" className="text-[10px]">10s Timeout</Badge>
            </div>
          </div>

          {/* Cron Heartbeats */}
          <div className="p-6 bg-background border rounded-lg space-y-3 hover:border-primary/50 transition-colors">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="size-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Cron Heartbeats</h3>
            <p className="text-xs text-muted-foreground font-sans">
              Monitor your background jobs and scheduled tasks. Get alerted immediately if a script fails to ping.
            </p>
            <div className="pt-2 flex gap-1.5">
                <Badge variant="secondary" className="text-[10px]">cURL Support</Badge>
                <Badge variant="secondary" className="text-[10px]">Grace Period</Badge>
            </div>
          </div>

          {/* Instant Alerts */}
          <div className="p-6 bg-background border rounded-lg space-y-3 hover:border-primary/50 transition-colors">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="size-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Native Alerts</h3>
            <p className="text-xs text-muted-foreground font-sans">
              Integrate with Slack and Email via Resend. Detailed incident logs and recovery notifications included.
            </p>
            <div className="pt-2 flex gap-1.5">
                <Badge variant="secondary" className="text-[10px]">Slack Webhooks</Badge>
                <Badge variant="secondary" className="text-[10px]">Resend</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Preview */}
      <section className="py-16 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold tracking-tight">Built for builders.</h2>
                <p className="text-muted-foreground text-sm font-sans">Everything you need, nothing you don&apos;t.</p>
            </div>
            
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl blur-lg group-hover:opacity-100 opacity-50 transition-opacity" />
                <div className="relative bg-black border rounded-lg overflow-hidden shadow-xl">
                    <div className="bg-muted/30 border-b px-3 py-1.5 flex items-center gap-1">
                        <div className="size-2 rounded-full bg-destructive/50" />
                        <div className="size-2 rounded-full bg-amber-500/50" />
                        <div className="size-2 rounded-full bg-primary/50" />
                        <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                            poller-engine.log
                        </span>
                    </div>
                    <div className="p-4 font-mono text-[11px] sm:text-xs space-y-1.5 text-primary/80 overflow-x-auto">
                        <p className="text-muted-foreground"># [SteadyState] Poller initialized v1.0.0</p>
                        <p><span className="text-white">2026-05-21 09:52:12</span> [OK] Checking 12 due monitors...</p>
                        <p><span className="text-white">2026-05-21 09:52:14</span> [UP] api.production.v3 <span className="text-muted-foreground">142ms</span></p>
                        <p><span className="text-white">2026-05-21 09:52:15</span> [UP] web.steadystate.dev <span className="text-muted-foreground">89ms</span></p>
                        <p className="text-destructive"><span className="text-white">2026-05-21 09:52:18</span> [DOWN] legacy-db-sync.internal <span className="text-muted-foreground">timeout</span></p>
                        <p><span className="text-white">2026-05-21 09:52:19</span> [ALERT] Dispatched Slack notification to #ops-alerts</p>
                        <div className="flex gap-2 animate-pulse mt-3">
                            <span className="bg-primary size-1.5 rounded-sm" />
                            <span className="text-white">_</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Activity className="size-4 text-primary" />
                <span className="font-semibold text-sm tracking-tight">SteadyState</span>
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground">
                <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            </div>
            <p className="text-[10px] text-muted-foreground font-sans">
                © 2026 SteadyState Labs. Industrial Strength.
            </p>
        </div>
      </footer>
    </div>
  );
}
