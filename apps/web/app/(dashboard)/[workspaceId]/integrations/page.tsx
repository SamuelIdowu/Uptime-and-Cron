"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Slack, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const settingsSchema = z.object({
  email: z.string().email().optional(),
  slackWebhookUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  telegramChatId: z.string().optional().nullable().or(z.literal("")),
  telegramBotToken: z.string().optional().nullable().or(z.literal("")),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function IntegrationsPage() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [savingSlack, setSavingSlack] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email: "",
      slackWebhookUrl: "",
      telegramChatId: "",
      telegramBotToken: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          form.reset({
            email: data.email || "",
            slackWebhookUrl: data.slackWebhookUrl || "",
            telegramChatId: data.telegramChatId || "",
            telegramBotToken: data.telegramBotToken || "",
          });
        }
      } catch (error) {
        toast.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [form]);

  const onSaveSlack = async () => {
    setSavingSlack(true);
    try {
      const values = form.getValues();
      const response = await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          slackWebhookUrl: values.slackWebhookUrl,
        }),
      });

      if (response.ok) {
        toast.success("Slack settings saved");
      } else {
        toast.error("Failed to save Slack settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSavingSlack(false);
    }
  };

  const onTestSlack = async () => {
    const url = form.getValues("slackWebhookUrl");
    if (!url) {
      toast.error("Webhook URL is required for testing");
      return;
    }

    setTestingSlack(true);
    try {
      const response = await fetch("/api/settings/slack/test", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        toast.success("Test alert sent to Slack");
      } else {
        const error = await response.text();
        toast.error(`Slack test failed: ${error}`);
      }
    } catch (error) {
      toast.error("An error occurred during testing");
    } finally {
      setTestingSlack(false);
    }
  };

  const onSaveTelegram = async () => {
    setSavingTelegram(true);
    try {
      const values = form.getValues();
      const response = await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          telegramChatId: values.telegramChatId,
          telegramBotToken: values.telegramBotToken,
        }),
      });

      if (response.ok) {
        toast.success("Telegram settings saved");
      } else {
        toast.error("Failed to save Telegram settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSavingTelegram(false);
    }
  };

  const onTestTelegram = async () => {
    const values = form.getValues();
    if (!values.telegramChatId || !values.telegramBotToken) {
      toast.error("Chat ID and Bot Token are required for testing");
      return;
    }

    setTestingTelegram(true);
    try {
      const response = await fetch("/api/settings/telegram/test", {
        method: "POST",
        body: JSON.stringify({
          chatId: values.telegramChatId,
          botToken: values.telegramBotToken,
        }),
      });

      if (response.ok) {
        toast.success("Test alert sent to Telegram");
      } else {
        toast.error("Telegram test failed");
      }
    } catch (error) {
      toast.error("An error occurred during testing");
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-0.5 border-b border-border/40 pb-6">
          <h1 className="text-2xl font-bold tracking-tight uppercase font-display">Integrations</h1>
          <p className="text-muted-foreground text-xs font-mono">Connect your external alerting clusters.</p>
        </div>

        <div className="grid gap-6">
          {/* Email Section */}
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="size-5" />
                <CardTitle className="text-sm uppercase font-display tracking-wider">Email Alerts</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Receive notifications directly to your primary account email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase text-muted-foreground">Notification Email</Label>
                <Input
                  id="email"
                  value={form.getValues("email") || ""}
                  readOnly
                  className="bg-muted/50 font-mono text-xs cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground italic">Email notifications are enabled by default for all critical incidents.</p>
              </div>
            </CardContent>
          </Card>

          {/* Slack Section */}
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Slack className="size-5" />
                <CardTitle className="text-sm uppercase font-display tracking-wider">Slack Integration</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Forward incidents to a Slack channel via incoming webhooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slackUrl" className="text-xs uppercase text-muted-foreground">Webhook URL</Label>
                <Input
                  id="slackUrl"
                  placeholder="https://hooks.slack.com/services/..."
                  className="font-mono text-xs"
                  {...form.register("slackWebhookUrl")}
                />
                {form.formState.errors.slackWebhookUrl && (
                  <p className="text-[10px] text-destructive">{form.formState.errors.slackWebhookUrl.message}</p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs uppercase"
                  onClick={onTestSlack}
                  disabled={testingSlack}
                >
                  {testingSlack ? <Loader2 className="mr-2 size-3 animate-spin" /> : null}
                  Test Connection
                </Button>
                <Button 
                  size="sm" 
                  className="text-xs uppercase"
                  onClick={onSaveSlack}
                  disabled={savingSlack}
                >
                  {savingSlack ? <Loader2 className="mr-2 size-3 animate-spin" /> : null}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Telegram Section */}
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="size-5" />
                <CardTitle className="text-sm uppercase font-display tracking-wider">Telegram Bot</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Receive instant alerts through your own Telegram bot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="botToken" className="text-xs uppercase text-muted-foreground">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="123456:ABC-DEF..."
                    className="font-mono text-xs"
                    {...form.register("telegramBotToken")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatId" className="text-xs uppercase text-muted-foreground">Chat ID</Label>
                  <Input
                    id="chatId"
                    placeholder="-100123456789"
                    className="font-mono text-xs"
                    {...form.register("telegramChatId")}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs uppercase"
                  onClick={onTestTelegram}
                  disabled={testingTelegram}
                >
                  {testingTelegram ? <Loader2 className="mr-2 size-3 animate-spin" /> : null}
                  Test Connection
                </Button>
                <Button 
                  size="sm" 
                  className="text-xs uppercase"
                  onClick={onSaveTelegram}
                  disabled={savingTelegram}
                >
                  {savingTelegram ? <Loader2 className="mr-2 size-3 animate-spin" /> : null}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
