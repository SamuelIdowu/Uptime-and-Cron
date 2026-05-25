"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { MonitorForm } from "./monitor-form";
import { HeartbeatForm } from "./heartbeat-form";
import { useState } from "react";
import { Zap, Heart, MonitorCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateMonitorModalProps {
  workspaceId: string;
  trigger?: React.ReactNode;
  defaultType?: "http" | "heartbeat";
}

export function CreateMonitorModal({ 
  workspaceId, 
  trigger, 
  defaultType = "http" 
}: CreateMonitorModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"http" | "heartbeat">(defaultType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="hidden" />
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-background border-border p-0 overflow-hidden rounded-md shadow-modal">
        <div className="flex h-full min-h-[500px]">
          {/* Sidebar */}
          <div className="w-64 bg-secondary/50 border-r border-border p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="eyebrow text-[10px] text-ink">Monitor Type</h2>
              <p className="text-[10px] text-mute uppercase font-bold opacity-50">Select check method</p>
            </div>
            
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setType("http")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-sm transition-all text-left border",
                  type === "http" 
                    ? "bg-primary text-background border-primary shadow-[0_0_15px_rgba(0,217,146,0.3)]" 
                    : "text-mute border-transparent hover:bg-secondary hover:text-ink"
                )}
              >
                <Zap className={cn("size-4", type === "http" ? "text-background" : "text-primary-soft")} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight">HTTP(S)</span>
                  <span className="text-[10px] opacity-70">Uptime & APIs</span>
                </div>
              </button>

              <button
                onClick={() => setType("heartbeat")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-sm transition-all text-left border",
                  type === "heartbeat" 
                    ? "bg-primary text-background border-primary shadow-[0_0_15px_rgba(0,217,146,0.3)]" 
                    : "text-mute border-transparent hover:bg-secondary hover:text-ink"
                )}
              >
                <Heart className={cn("size-4", type === "heartbeat" ? "text-background" : "text-primary-soft")} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight">Heartbeat</span>
                  <span className="text-[10px] opacity-70">Cron & Jobs</span>
                </div>
              </button>
            </nav>

            <div className="mt-auto p-4 bg-secondary rounded-sm border border-border">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <MonitorCheck className="size-4" />
                <span className="eyebrow text-[9px]">SteadyState</span>
              </div>
              <p className="text-[10px] text-mute leading-relaxed font-mono">
                Deploying a new monitor will immediately initiate its first check sequence from our global edge nodes.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-10 overflow-y-auto bg-background">
            <DialogHeader className="mb-10 text-left">
              <DialogTitle className="display-md text-inkStrong uppercase">
                {type === "http" ? "New HTTP Monitor" : "New Heartbeat Monitor"}
              </DialogTitle>
              <DialogDescription className="text-mute text-sm font-mono mt-2">
                {type === "http" 
                  ? "Monitor any URL for uptime, response code, and latency." 
                  : "Track background jobs and scripts to ensure they finish on time."}
              </DialogDescription>
            </DialogHeader>

            {type === "http" ? (
              <MonitorForm onSuccess={() => setOpen(false)} />
            ) : (
              <HeartbeatForm onSuccess={() => setOpen(false)} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
