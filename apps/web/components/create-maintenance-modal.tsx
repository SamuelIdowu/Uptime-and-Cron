"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { MaintenanceForm } from "./maintenance-form";
import { useState } from "react";
import { Wrench, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Monitor, HeartbeatMonitor } from "@steady-state/db";

interface CreateMaintenanceModalProps {
  monitors: Monitor[];
  heartbeats: HeartbeatMonitor[];
  trigger?: React.ReactNode;
}

export function CreateMaintenanceModal({ 
  monitors, 
  heartbeats, 
  trigger 
}: CreateMaintenanceModalProps) {
  const [open, setOpen] = useState(false);

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
              <h2 className="eyebrow text-[10px] text-ink">Operations</h2>
              <p className="text-[10px] text-mute uppercase font-bold opacity-50">Maintenance Scheduler</p>
            </div>
            
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-sm">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <ShieldAlert className="size-4" />
                <span className="eyebrow text-[9px]">Sovereign Control</span>
              </div>
              <p className="text-[10px] text-mute leading-relaxed font-mono">
                Maintenance windows suppress all alerts and skip monitoring cycles for the selected duration. Use with caution.
              </p>
            </div>

            <div className="mt-auto p-4 bg-secondary rounded-sm border border-border">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Clock className="size-4" />
                <span className="eyebrow text-[9px]">Timing Engine</span>
              </div>
              <p className="text-[10px] text-mute leading-relaxed font-mono">
                Windows are executed in UTC. Ensure your start and end times align with your local deployment schedule.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-10 overflow-y-auto bg-background">
            <DialogHeader className="mb-10 text-left">
              <DialogTitle className="display-md text-inkStrong uppercase flex items-center gap-3">
                <Wrench className="size-6 text-primary" />
                Schedule Maintenance
              </DialogTitle>
              <DialogDescription className="text-mute text-sm font-mono mt-2">
                Define a timeframe to silence infrastructure alerts during planned upgrades or migrations.
              </DialogDescription>
            </DialogHeader>

            <MaintenanceForm 
              monitors={monitors} 
              heartbeats={heartbeats} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
