import { auth } from "@clerk/nextjs/server";
import { db, alertSettings } from "@steady-state/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Activity, Bell, Mail, Slack, CreditCard, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AlertChannelForm } from "./alert-channel-form";

export default async function SettingsPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const settings = await db.query.alertSettings.findFirst({
    where: eq(alertSettings.userId, userId),
  });

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account preferences and notification channels.
          </p>
        </header>

        <div className="space-y-12">
          {/* Notifications Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground">
              <Bell className="size-4" />
              <h2>Notifications</h2>
            </div>
            
            <AlertChannelForm initialData={settings} />
          </section>

          <Separator />

          {/* Plan & Billing Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground">
              <CreditCard className="size-4" />
              <h2>Plan & Billing</h2>
            </div>
            
            <div className="bg-card border rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium">Current Plan: Free</p>
                  <p className="text-sm text-muted-foreground">10 monitors · 5-minute intervals</p>
                </div>
                <button className="text-sm text-primary hover:underline font-medium">
                  Manage Billing →
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono uppercase tracking-wider">
                  <span className="text-muted-foreground">Usage</span>
                  <span>0 / 10 monitors</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[0%]" />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Danger Zone Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-destructive">
              <ShieldAlert className="size-4" />
              <h2>Danger Zone</h2>
            </div>
            
            <div className="border border-destructive/20 rounded-xl p-6 bg-destructive/5">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently remove all monitors and data.</p>
                </div>
                <button className="px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded text-sm hover:bg-destructive/90 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
