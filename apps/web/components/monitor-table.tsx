"use client";

import { Monitor, MonitorCheck, HeartbeatMonitor, HeartbeatPing } from "@steady-state/db";
import { StatusBadge } from "@/components/status-badge";
import { MiniSparkline } from "@/components/sparkline";
import { PingTimeline, PingStatus } from "@/components/ping-timeline";
import { MoreVertical, ExternalLink, Pause, Play, Edit2, Trash2, Clock, Globe, Zap, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";

type UnifiedMonitor = 
  | (Monitor & { type: 'http', checks?: MonitorCheck[] }) 
  | (HeartbeatMonitor & { type: 'heartbeat', pings?: HeartbeatPing[] });

interface MonitorTableProps {
  monitors: UnifiedMonitor[];
  workspaceId: string;
}

export function MonitorTable({ monitors, workspaceId }: MonitorTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [monitorToDelete, setMonitorToDelete] = useState<UnifiedMonitor | null>(null);

  const onTogglePause = async (e: React.MouseEvent, monitor: UnifiedMonitor) => {
    e.stopPropagation();
    setIsLoading(monitor.id);
    const endpoint = monitor.type === 'http' ? 'monitors' : 'heartbeats';
    try {
      await fetch(`/api/${endpoint}/${monitor.id}`, {
        method: "PATCH",
        body: JSON.stringify({ paused: !monitor.paused }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  const onDeleteConfirm = async () => {
    if (!monitorToDelete) return;
    setIsLoading(monitorToDelete.id);
    const endpoint = monitorToDelete.type === 'http' ? 'monitors' : 'heartbeats';
    try {
      await fetch(`/api/${endpoint}/${monitorToDelete.id}`, {
        method: "DELETE",
      });
      router.refresh();
      setMonitorToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-md bg-background border border-border shadow-sm">
      <ConfirmationModal 
        open={!!monitorToDelete}
        onOpenChange={(open) => !open && setMonitorToDelete(null)}
        title="Decommission Node"
        description={`Are you sure you want to delete "${monitorToDelete?.name}"? This will permanently purge all historical uptime data and alert logs.`}
        confirmText="Delete Monitor"
        variant="destructive"
        onConfirm={onDeleteConfirm}
        isLoading={isLoading === monitorToDelete?.id}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Status</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70">Monitor</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 hidden md:table-cell text-center">Activity (24h)</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 hidden lg:table-cell">Metrics</th>
              <th className="px-6 py-4 eyebrow text-[10px] text-muted-foreground opacity-70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {monitors.map((monitor) => {
              const isHttp = monitor.type === 'http';
              const sparklineData = isHttp 
                ? (monitor as any).checks?.map((c: any) => c.responseMs || 0).reverse() 
                : [];
              
              const timelineData: PingStatus[] = !isHttp
                ? (monitor as any).pings?.map((p: any) => (p.exitCode === 0 || p.exitCode === null ? "up" : "down")).reverse()
                : [];

              return (
                <tr 
                  key={monitor.id}
                  className="group hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/${workspaceId}/${isHttp ? 'monitors' : 'heartbeats'}/${monitor.id}`)}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <StatusBadge status={monitor.paused ? "paused" : monitor.status} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-ink truncate tracking-tight">{monitor.name}</span>
                      </div>
                      <span className="text-xs text-mute font-mono truncate max-w-[240px]">
                        {isHttp ? (monitor as any).url : `TOKEN: ${(monitor as any).pingToken.slice(0, 12)}...`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <div className="flex justify-center">
                      {isHttp ? (
                        <MiniSparkline status={monitor.status} data={sparklineData} />
                      ) : (
                        <PingTimeline data={timelineData} maxItems={20} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink font-mono tracking-tighter">
                          {isHttp ? `${(monitor as any).uptime7d || '100'}%` : 'ACTIVE'}
                        </span>
                        <span className="eyebrow text-[9px] text-mute">UPTIME</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-mute font-mono">
                          {isHttp ? `${(monitor as any).avgResponseMs || '0'}ms` : `${(monitor as any).periodMinutes}m INT.`}
                        </span>
                        <span className="eyebrow text-[9px] text-mute">{isHttp ? 'LATENCY' : 'SCHED'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover border border-border rounded-md shadow-xl p-1">
                        <DropdownMenuItem 
                          onClick={(e) => onTogglePause(e, monitor)} 
                          disabled={isLoading === monitor.id}
                          className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer hover:bg-accent focus:bg-accent"
                        >
                          {monitor.paused ? (
                            <><Play className="size-4 mr-2 text-primary" /> Resume</>
                          ) : (
                            <><Pause className="size-4 mr-2 text-primary-soft" /> Pause</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push(`/${workspaceId}/${isHttp ? 'monitors' : 'heartbeats'}/${monitor.id}`)}
                          className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer hover:bg-accent focus:bg-accent"
                        >
                          <Edit2 className="size-4 mr-2 text-mute" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40 my-1" />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMonitorToDelete(monitor);
                          }}
                          disabled={isLoading === monitor.id}
                          className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                        >
                          <Trash2 className="size-4 mr-2" /> Delete
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
