"use client";

import { useState } from "react";
import { Check, Copy, ChevronDown, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnvironments } from "@/hooks/use-environments";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CopyFieldProps {
  value: string;
  token?: string; // Optional token for dynamic URL generation
  className?: string;
  heartbeatId?: string; // ID for rotation
}

export function CopyField({ value, token, className, heartbeatId }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const { environments, isLoading } = useEnvironments();
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const router = useRouter();

  const displayUrl = selectedEnv && token 
    ? `${selectedEnv}/api/ping/${token}`
    : value;

  const onCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onRotate = async () => {
    if (!heartbeatId) return;

    if (!window.confirm("Are you sure you want to rotate this token? The old endpoint will stop working immediately.")) {
      return;
    }

    setIsRotating(true);
    try {
      const res = await fetch(`/api/heartbeats/${heartbeatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotateToken: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to rotate token");
      }

      toast.success("Token rotated successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to rotate token");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          readOnly
          value={displayUrl}
          className="font-mono text-sm bg-muted/30"
        />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="size-4 text-primary" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
        {heartbeatId && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onRotate}
            disabled={isRotating}
            className="shrink-0 hover:text-destructive hover:border-destructive transition-colors"
            title="Rotate Token"
          >
            <RefreshCw className={`size-4 ${isRotating ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {token && environments.length > 0 && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" className="h-6 gap-1.5 px-2 text-[10px] eyebrow text-mute hover:text-ink">
                <Globe className="size-3" />
                <span>Base URL: {selectedEnv ? environments.find(e => e.baseUrl === selectedEnv)?.name : "Default"}</span>
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border p-1">
              <DropdownMenuItem 
                onClick={() => setSelectedEnv(null)}
                className="text-[10px] eyebrow cursor-pointer"
              >
                Default (Server Root)
              </DropdownMenuItem>
              {environments.map((env) => (
                <DropdownMenuItem 
                  key={env.id}
                  onClick={() => setSelectedEnv(env.baseUrl)}
                  className="text-[10px] eyebrow cursor-pointer"
                >
                  {env.name} ({env.baseUrl})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
