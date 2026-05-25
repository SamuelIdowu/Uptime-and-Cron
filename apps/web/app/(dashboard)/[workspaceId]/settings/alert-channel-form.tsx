"use client";

import { AlertSettings } from "@steady-state/db";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Slack, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AlertChannelFormProps {
  initialData?: AlertSettings;
}

export function AlertChannelForm({ initialData }: AlertChannelFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialData?.email || "");
  const [slackUrl, setSlackUrl] = useState(initialData?.slackWebhookUrl || "");
  const [telegramChatId, setTelegramChatId] = useState(initialData?.telegramChatId || "");
  const [telegramBotToken, setTelegramBotToken] = useState(initialData?.telegramBotToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [tgTestStatus, setTgTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const onSave = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          email,
          slackWebhookUrl: slackUrl || null,
          telegramChatId: telegramChatId || null,
          telegramBotToken: telegramBotToken || null,
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

  const onTestTelegram = async () => {
    if (!telegramChatId || !telegramBotToken) return;
    setTgTestStatus("testing");
    try {
      const res = await fetch("/api/settings/telegram/test", {
        method: "POST",
        body: JSON.stringify({ chatId: telegramChatId, botToken: telegramBotToken }),
      });
      if (res.ok) {
        setTgTestStatus("success");
      } else {
        setTgTestStatus("error");
      }
    } catch (error) {
      setTgTestStatus("error");
    }
  };

  return (
    <div className="grid gap-4 sm:gap-6">
      {/* Email Channel */}
      <div className="bg-card border border-border p-4 sm:p-6 space-y-4 rounded-md">
        <div className="flex items-center gap-2.5">
          <Mail className="size-4 text-primary" />
          <h3 className="display-sm text-ink uppercase tracking-tight">Email Notifications</h3>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-[10px] font-bold eyebrow text-mute">Alert Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alerts@example.com"
            />
            <Button onClick={onSave} disabled={isLoading} className="font-bold eyebrow text-[10px] px-6">
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Slack Channel */}
      <div className="bg-card border border-border p-4 sm:p-6 space-y-4 rounded-md">
        <div className="flex items-center gap-2.5">
          <Slack className="size-4 text-primary" />
          <h3 className="display-sm text-ink uppercase tracking-tight">Slack Integration</h3>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slack" className="text-[10px] font-bold eyebrow text-mute">Webhook URL</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="slack"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
            />
            <div className="flex gap-2 shrink-0">
              <Button onClick={onSave} disabled={isLoading} className="font-bold eyebrow text-[10px] px-6">
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={onTestSlack} 
                disabled={!slackUrl || testStatus === "testing"}
                className="font-bold eyebrow text-[10px] px-4"
              >
                {testStatus === "testing" ? "Testing..." : "Send Test"}
              </Button>
            </div>
          </div>
          {testStatus === "success" && (
            <p className="text-[10px] text-primary flex items-center gap-1.5 mt-1 font-mono uppercase">
              <CheckCircle2 className="size-3" /> Test alert sent successfully.
            </p>
          )}
          {testStatus === "error" && (
            <p className="text-[10px] text-status-down flex items-center gap-1.5 mt-1 font-mono uppercase">
              <AlertCircle className="size-3" /> Failed to send test alert. Check your URL.
            </p>
          )}
        </div>
      </div>

      {/* Telegram Channel */}
      <div className="bg-card border border-border p-4 sm:p-6 space-y-4 rounded-md">
        <div className="flex items-center gap-2.5">
          <Send className="size-4 text-primary" />
          <h3 className="display-sm text-ink uppercase tracking-tight">Telegram Integration</h3>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="telegramToken" className="text-[10px] font-bold eyebrow text-mute">Bot Token</Label>
            <Input
              id="telegramToken"
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telegram" className="text-[10px] font-bold eyebrow text-mute">Chat ID</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="telegram"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-100123456789"
              />
              <div className="flex gap-2 shrink-0">
                <Button onClick={onSave} disabled={isLoading} className="font-bold eyebrow text-[10px] px-6">
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onTestTelegram} 
                  disabled={!telegramChatId || !telegramBotToken || tgTestStatus === "testing"}
                  className="font-bold eyebrow text-[10px] px-4"
                >
                  {tgTestStatus === "testing" ? "Testing..." : "Send Test"}
                </Button>
              </div>
            </div>
            {tgTestStatus === "success" && (
              <p className="text-[10px] text-primary flex items-center gap-1.5 mt-1 font-mono uppercase">
                <CheckCircle2 className="size-3" /> Test alert sent successfully.
              </p>
            )}
            {tgTestStatus === "error" && (
              <p className="text-[10px] text-status-down flex items-center gap-1.5 mt-1 font-mono uppercase">
                <AlertCircle className="size-3" /> Failed to send test alert. Check ID/Token.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
