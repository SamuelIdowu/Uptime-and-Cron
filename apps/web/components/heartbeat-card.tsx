"use client";

import { HeartbeatMonitor, HeartbeatPing } from "@steady-state/db";
import { StatusDot } from "@/components/status-dot";
import { PingTimeline, PingStatus } from "@/components/ping-timeline";
import { MoreVertical, Copy, Pause, Play, Edit2, Trash2, Clock } from "lucide-react";
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

interface HeartbeatCardProps {
  heartbeat: HeartbeatMonitor & { pings?: HeartbeatPing[] };
  workspaceId: string;
}

export function HeartbeatCard({ heartbeat, workspaceId }: HeartbeatCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const timelineData: PingStatus[] = heartbeat.pings
    ?.map((p) => (p.exitCode === 0 || p.exitCode === null ? "up" : "down"))
    .reverse() as PingStatus[];

  const onTogglePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await fetch(`/api/heartbeats/${heartbeat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ paused: !heartbeat.paused }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this heartbeat?")) return;
    setIsLoading(true);
    try {
      await fetch(`/api/heartbeats/${heartbeat.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPingUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/api/ping/${heartbeat.pingToken}`;
    navigator.clipboard.writeText(url);
    // TODO: Add toast notification
  };

  const formatPeriod = (mins: number) => {
    if (mins >= 1440) return `Every ${Math.round(mins / 1440)} days`;
    if (mins >= 60) return `Every ${Math.round(mins / 60)} hours`;
    return `Every ${mins} min`;
  };

  return (
    <div 
      className="group relative flex flex-row items-center p-4 py-3 gap-4 bg-card border border-border hover:border-primary transition-all cursor-pointer rounded-md shadow-sm hover:translate-y-[-1px]"
      onClick={() => router.push(`/${workspaceId}/heartbeats/${heartbeat.id}`)}
    >
      <StatusDot status={heartbeat.paused ? "paused" : heartbeat.status} size="md" className="border border-border" />
      
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <h3 className="text-[20px] font-semibold tracking-tight text-foreground truncate">
          {heartbeat.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <Clock className="size-3" />
          <span>{formatPeriod(heartbeat.periodMinutes)}</span>
          <span className="opacity-50">·</span>
          <span>Grace {heartbeat.graceMinutes}m</span>
        </div>
      </div>

      <div className="hidden md:block px-4 border-l border-dashed border-border/40 h-full flex items-center">
        <PingTimeline data={timelineData} maxItems={20} />
      </div>

      <div className="flex items-center gap-3 border-l border-dashed border-border/40 pl-4">
        <div className="hidden lg:flex flex-col items-end whitespace-nowrap">
          <span className="eyebrow text-[10px] text-muted-foreground">Last Ping</span>
          <span className="text-foreground text-xs font-mono">
            {heartbeat.lastPingAt 
              ? formatDistanceToNow(new Date(heartbeat.lastPingAt), { addSuffix: true })
              : "Never"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border border-border rounded-md shadow-xl">
            <DropdownMenuItem onClick={copyPingUrl} className="text-foreground eyebrow text-[12px] hover:bg-accent focus:bg-accent cursor-pointer">
              <Copy className="size-4 mr-2" /> Copy Ping URL
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={onTogglePause} disabled={isLoading} className="text-foreground eyebrow text-[12px] hover:bg-accent focus:bg-accent cursor-pointer">
              {heartbeat.paused ? (
                <><Play className="size-4 mr-2" /> Resume</>
              ) : (
                <><Pause className="size-4 mr-2" /> Pause</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/${workspaceId}/heartbeats/${heartbeat.id}`)} className="text-foreground eyebrow text-[12px] hover:bg-accent focus:bg-accent cursor-pointer">
              <Edit2 className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={onDelete} 
              disabled={isLoading}
              className="text-destructive eyebrow text-[12px] hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
