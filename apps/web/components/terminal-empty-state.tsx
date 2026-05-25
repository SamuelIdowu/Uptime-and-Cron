"use client";

import { Zap, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMonitorModal } from "./create-monitor-modal";

export function TerminalEmptyState({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-card border border-border text-center rounded-md relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
      <div className="relative size-14 rounded-md bg-secondary border border-border flex items-center justify-center mb-8 shadow-inset-glow">
        <Activity className="size-6 text-primary" />
      </div>
      <h3 className="display-md text-inkStrong uppercase tracking-tight mb-3">
        Zero Nodes Provisioned
      </h3>
      <p className="text-mute text-sm font-mono max-w-sm mb-12 leading-relaxed">
        Your global monitoring cluster is currently inactive. Deploy a node to begin real-time infrastructure observation.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto">
        <CreateMonitorModal 
          workspaceId={userId}
          defaultType="http"
          trigger={
            <Button className="eyebrow text-[11px] px-8 h-11 w-full sm:w-auto shadow-[0_0_15px_rgba(0,217,146,0.2)]">
              <Zap className="size-4 mr-2" />
              Provision HTTP Node
            </Button>
          }
        />
        <CreateMonitorModal 
          workspaceId={userId}
          defaultType="heartbeat"
          trigger={
            <Button variant="outline" className="eyebrow text-[11px] px-8 h-11 w-full sm:w-auto">
              <Heart className="size-4 mr-2" />
              Provision Heartbeat
            </Button>
          }
        />
      </div>
    </div>
  );
}
