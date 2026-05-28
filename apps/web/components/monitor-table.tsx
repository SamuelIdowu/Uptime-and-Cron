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
  baseUrl?: string;
}

export function MonitorTable({ monitors, workspaceId, baseUrl }: MonitorTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [monitorToDelete, setMonitorToDelete] = useState<UnifiedMonitor | null>(null);

  const onCopyPingUrl = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    const storageKey = `ss_env_${workspaceId}`;
    const savedEnv = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const url = savedEnv 
      ? `${savedEnv}/api/ping/${token}`
      : `${baseUrl || window.location.origin}/api/ping/${token}`;
    navigator.clipboard.writeText(url);
  };

  const onTogglePause = async (e: React.MouseEvent, monitor: UnifiedMonitor) => {
    e.stopPropagation();
    setIsLoading(monitor.id);
    const endpoint = monitor.type === 'http' ? 'monitors' : 'heartbeats';
    try {
      const res = await fetch(`/api/${endpoint}/${monitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !monitor.paused }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to toggle status");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  const onDeleteConfirm = async () => {
    if (!monitorToDelete) return;
    setIsLoading(monitorToDelete.id);
    const endpoint = monitorToDelete.type === 'http' ? 'monitors' : 'heartbeats';
    try {
      const res = await fetch(`/api/${endpoint}/${monitorToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete");
      }

      router.refresh();
      setMonitorToDelete(null);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
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
                        {isHttp && (monitor as any).targets && (monitor as any).targets.length > 1 && (
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded-sm uppercase tracking-tighter">
                              {(monitor as any).targets.length} Nodes
                            </span>
                            <span className="px-1.5 py-0.5 bg-secondary border border-border text-mute text-[9px] font-bold rounded-sm uppercase tracking-tighter">
                              {(monitor as any).healthThreshold}
                            </span>
                          </div>
                        )}
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
                        <PingTimeline data={timelineData} maxItems={50} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink font-mono tracking-tighter">
                          {(() => {
                            const uptime = (monitor as any).uptime7d;
                            if (uptime) return `${uptime}%`;
                            
                            // Fallback calculation for new monitors
                            if (isHttp) {
                              const checks = (monitor as any).checks || [];
                              if (checks.length === 0) return "100%";
                              const upChecks = checks.filter((c: any) => c.status === 'up').length;
                              return `${((upChecks / checks.length) * 100).toFixed(1)}%`;
                            } else {
                              const pings = (monitor as any).pings || [];
                              if (pings.length === 0) return "---%";
                              return monitor.status === 'up' ? "100%" : "0.0%";
                            }
                          })()}
                        </span>
                        <span className="eyebrow text-[9px] text-mute">UPTIME</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-mute font-mono">
                          {isHttp ? `${(monitor as any).avgResponseMs || '---'}ms` : `${(monitor as any).periodMinutes}m INT.`}
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
                          onClick={() => router.push(`/${workspaceId}/${isHttp ? 'monitors' : 'heartbeats'}/${monitor.id}/edit`)}
                          className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer hover:bg-accent focus:bg-accent"
                        >
                          <Edit2 className="size-4 mr-2 text-mute" /> Edit
                        </DropdownMenuItem>
                        {!isHttp && (
                          <DropdownMenuItem 
                            onClick={(e) => onCopyPingUrl(e, (monitor as any).pingToken)}
                            className="flex items-center px-3 py-2 text-[11px] font-bold eyebrow cursor-pointer hover:bg-accent focus:bg-accent"
                          >
                            <ExternalLink className="size-4 mr-2 text-primary-soft" /> Copy Ping URL
                          </DropdownMenuItem>
                        )}
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
