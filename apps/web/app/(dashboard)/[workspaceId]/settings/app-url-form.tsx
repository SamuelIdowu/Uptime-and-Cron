"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, ShieldCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppUrlFormProps {
  initialAppUrl?: string | null;
}

export function AppUrlForm({ initialAppUrl }: AppUrlFormProps) {
  const router = useRouter();
  const [appUrl, setAppUrl] = useState(initialAppUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onSave = async () => {
    if (appUrl && !appUrl.startsWith("http")) {
      setMessage({ type: "error", text: "URL must start with http:// or https://" });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          appUrl: appUrl || null,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setMessage({ type: "success", text: "Application URL updated successfully." });
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update URL." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border p-4 sm:p-6 space-y-6 rounded-md">
      <div className="flex items-center gap-2.5">
        <Globe className="size-4 text-primary" />
        <h3 className="display-sm text-ink uppercase tracking-tight">Public Infrastructure URL</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-[11px] text-mute font-mono uppercase leading-relaxed max-w-2xl">
          This URL is used as the base for all heartbeat check-in endpoints. 
          If you are using a tunnel (like ngrok) or a custom domain, specify it here.
          Default: Current request host or NEXT_PUBLIC_APP_URL.
        </p>

        <div className="grid gap-2">
          <Label htmlFor="appUrl" className="text-[10px] font-bold eyebrow text-mute">Public Base URL</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="appUrl"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://uptime.yourdomain.com"
              className="font-mono text-sm"
            />
            <Button onClick={onSave} disabled={isLoading} className="font-bold eyebrow text-[10px] px-8 h-10 shrink-0">
              {isLoading ? "Saving..." : "Update URL"}
            </Button>
          </div>
          
          {message?.type === "success" && (
            <p className="text-[10px] text-primary flex items-center gap-1.5 mt-1 font-mono uppercase">
              <ShieldCheck className="size-3" /> {message.text}
            </p>
          )}
          {message?.type === "error" && (
            <p className="text-[10px] text-status-down flex items-center gap-1.5 mt-1 font-mono uppercase">
              <AlertCircle className="size-3" /> {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
