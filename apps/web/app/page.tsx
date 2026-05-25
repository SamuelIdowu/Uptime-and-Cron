import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Heart, Bell, ShieldCheck, Terminal, ArrowRight, Github } from "lucide-react";

export default function LandingPage() {
  const { userId } = auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">SteadyState</span>
          </div>
          <div className="flex items-center gap-4">
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
      <section className="py-24 sm:py-32 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] border-primary/30 text-primary">
            v1.0 Early Access
          </Badge>
          <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-foreground balance leading-[1.1]">
            Industrial-grade monitoring for <br className="hidden sm:block" />
            <span className="text-primary italic">solo developers.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Stop worrying about downtime. Robust HTTP checks and cron job heartbeats 
            with instant alerts via Slack and Email.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2 group">
                Start Monitoring Free
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
              <Github className="size-4" />
              View Source
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-card/30 border-y border-border/50 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* HTTP Monitoring */}
          <div className="p-8 bg-background border rounded-xl space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">HTTP Uptime</h3>
            <p className="text-sm text-muted-foreground font-sans">
              High-frequency polling for your APIs and web apps. Customize status codes and intervals down to 1 minute.
            </p>
            <div className="pt-4 flex gap-2">
                <Badge variant="secondary" className="font-mono text-[9px] uppercase">Axios</Badge>
                <Badge variant="secondary" className="font-mono text-[9px] uppercase">10s Timeout</Badge>
            </div>
          </div>

          {/* Cron Heartbeats */}
          <div className="p-8 bg-background border rounded-xl space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Cron Heartbeats</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Monitor your background jobs and scheduled tasks. Get alerted immediately if a script fails to ping.
            </p>
            <div className="pt-4 flex gap-2">
                <Badge variant="secondary" className="font-mono text-[9px] uppercase">cURL Support</Badge>
                <Badge variant="secondary" className="font-mono text-[9px] uppercase">Grace Period</Badge>
            </div>
          </div>

          {/* Instant Alerts */}
          <div className="p-8 bg-background border rounded-xl space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Native Alerts</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Integrate with Slack and Email via Resend. Detailed incident logs and recovery notifications included.
            </p>
            <div className="pt-4 flex gap-2">
                <Badge variant="secondary" className="font-mono text-[9px] uppercase">Slack Webhooks</Badge>
                <Badge variant="secondary" className="font-mono text-[9px] uppercase">Resend</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Preview */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Built for builders.</h2>
                <p className="text-muted-foreground font-sans">Everything you need, nothing you don&apos;t.</p>
            </div>
            
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl blur-xl group-hover:opacity-100 opacity-50 transition-opacity" />
                <div className="relative bg-black border rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-muted/30 border-b px-4 py-2 flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full bg-destructive/50" />
                        <div className="size-2.5 rounded-full bg-amber-500/50" />
                        <div className="size-2.5 rounded-full bg-primary/50" />
                        <span className="ml-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                            poller-engine.log
                        </span>
                    </div>
                    <div className="p-6 font-mono text-xs sm:text-sm space-y-2 text-primary/80 overflow-x-auto">
                        <p className="text-muted-foreground"># [SteadyState] Poller initialized v1.0.0</p>
                        <p><span className="text-white">2026-05-21 09:52:12</span> [OK] Checking 12 due monitors...</p>
                        <p><span className="text-white">2026-05-21 09:52:14</span> [UP] api.production.v3 <span className="text-muted-foreground">142ms</span></p>
                        <p><span className="text-white">2026-05-21 09:52:15</span> [UP] web.steadystate.dev <span className="text-muted-foreground">89ms</span></p>
                        <p className="text-destructive"><span className="text-white">2026-05-21 09:52:18</span> [DOWN] legacy-db-sync.internal <span className="text-muted-foreground">timeout</span></p>
                        <p><span className="text-white">2026-05-21 09:52:19</span> [ALERT] Dispatched Slack notification to #ops-alerts</p>
                        <div className="flex gap-2 animate-pulse mt-4">
                            <span className="bg-primary size-2 rounded-sm" />
                            <span className="text-white">_</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Activity className="size-5 text-primary" />
                <span className="font-semibold tracking-tight">SteadyState</span>
            </div>
            <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
                © 2026 SteadyState Labs. Industrial Strength.
            </p>
        </div>
      </footer>
    </div>
  );
}
