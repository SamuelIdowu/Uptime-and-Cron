"use client";

import { AlertSettings } from "@steady-state/db";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Slack, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AlertChannelFormProps {
  initialData?: AlertSettings;
}

export function AlertChannelForm({ initialData }: AlertChannelFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialData?.email || "");
  const [slackUrl, setSlackUrl] = useState(initialData?.slackWebhookUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const onSave = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          email,
          slackWebhookUrl: slackUrl || null,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onTestSlack = async () => {
    if (!slackUrl) return;
    setTestStatus("testing");
    try {
      const res = await fetch("/api/settings/slack/test", {
        method: "POST",
        body: JSON.stringify({ url: slackUrl }),
      });
      if (res.ok) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
      }
    } catch (error) {
      setTestStatus("error");
    }
  };

  return (
    <div className="grid gap-6">
      {/* Email Channel */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mail className="size-4 text-primary" />
          <h3>Email Notifications</h3>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-muted-foreground">Alert Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alerts@example.com"
            />
            <Button onClick={onSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Slack Channel */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Slack className="size-4 text-primary" />
          <h3>Slack Integration</h3>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slack" className="text-muted-foreground">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="slack"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="font-mono"
            />
            <Button onClick={onSave} disabled={isLoading}>
              Save
            </Button>
            <Button 
              variant="outline" 
              onClick={onTestSlack} 
              disabled={!slackUrl || testStatus === "testing"}
            >
              {testStatus === "testing" ? "Testing..." : "Send Test"}
            </Button>
          </div>
          {testStatus === "success" && (
            <p className="text-xs text-primary flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="size-3" /> Test alert sent successfully.
            </p>
          )}
          {testStatus === "error" && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="size-3" /> Failed to send test alert. Check your URL.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
