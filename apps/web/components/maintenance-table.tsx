"use client";

import { MaintenanceWindow, Monitor, HeartbeatMonitor } from "@steady-state/db";
import { 
  MoreVertical, 
  Trash2, 
  Clock, 
  Globe, 
  Zap, 
  Heart, 
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MaintenanceTableProps {
  windows: (MaintenanceWindow & { 
    monitor?: Monitor | null; 
    heartbeat?: HeartbeatMonitor | null; 
  })[];
  workspaceId: string;
}

export function MaintenanceTable({ windows, workspaceId }: MaintenanceTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [windowToDelete, setWindowToDelete] = useState<any | null>(null);

  const onDeleteConfirm = async () => {
    if (!windowToDelete) return;
    setIsLoading(windowToDelete.id);
    try {
      const res = await fetch(`/api/maintenance/${windowToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete");
      }

      toast.success("Maintenance window cancelled");
      router.refresh();
      setWindowToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  if (windows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 border border-dashed border-border rounded-md">
        <Clock className="size-8 text-mute mb-4 opacity-20" />
        <h3 className="text-sm font-bold text-ink uppercase tracking-tight">No Active Schedules</h3>
        <p className="text-xs text-mute font-mono mt-1">Infrastructure is currently operating without planned dormancy.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-md bg-background border border-border shadow-sm">
      <ConfirmationModal 
        open={!!windowToDelete}
        onOpenChange={(open) => !open && setWindowToDelete(null)}
        title="Cancel Maintenance"
        description={`Are you sure you want to cancel this maintenance window? Monitoring and alerts will resume immediately if the window was active.`}
        confirmText="Cancel Window"
        variant="destructive"
        onConfirm={onDeleteConfirm}
        isLoading={isLoading === windowToDelete?.id}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Status</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Target</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Schedule (UTC)</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 hidden md:table-cell">Reason</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {windows.map((window) => {
              const now = new Date();
              const start = new Date(window.startTime);
              const end = new Date(window.endTime);
              const isActive = isBefore(start, now) && isAfter(end, now);
              const isUpcoming = isAfter(start, now);

              return (
                <tr 
                  key={window.id}
                  className="group hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    {isActive ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 eyebrow text-[9px] px-2 py-0.5 animate-pulse">
                        Active
                      </Badge>
                    ) : isUpcoming ? (
                      <Badge variant="outline" className="bg-secondary text-mute border-border eyebrow text-[9px] px-2 py-0.5">
                        Upcoming
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-secondary/50 text-mute/50 border-border eyebrow text-[9px] px-2 py-0.5">
                        Expired
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-sm">
                        {window.monitorId ? (
                          <Zap className="size-4 text-primary-soft" />
                        ) : window.heartbeatId ? (
                          <Heart className="size-4 text-primary-soft" />
                        ) : (
                          <Globe className="size-4 text-primary-soft" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-ink tracking-tight uppercase">
                          {window.monitor?.name || window.heartbeat?.name || "Global Infrastructure"}
                        </span>
                        <span className="text-[10px] text-mute font-mono uppercase">
                          {window.monitorId ? "HTTP Monitor" : window.heartbeatId ? "Heartbeat" : "All Nodes"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-ink">
                        <Calendar className="size-3 text-mute" />
                        <span className="text-[11px] font-mono">{format(start, "MMM d, HH:mm")} — {format(end, "HH:mm")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-mute">
                        <Clock className="size-3" />
                        <span className="text-[10px] font-mono">
                          {isActive 
                            ? `Ends in ${formatDistanceToNow(end)}` 
                            : `Starts in ${formatDistanceToNow(start)}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="text-xs text-mute italic">
                      {window.reason || "No reason provided"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover border border-border rounded-md shadow-xl p-1">
                        <DropdownMenuItem 
                          onClick={() => setWindowToDelete(window)}
                          disabled={isLoading === window.id}
                          className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                        >
                          <Trash2 className="size-4 mr-2" /> Cancel Window
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
