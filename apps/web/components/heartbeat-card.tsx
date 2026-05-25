"use client";

import { HeartbeatMonitor } from "@steady-state/db";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
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
  heartbeat: HeartbeatMonitor;
}

export function HeartbeatCard({ heartbeat }: HeartbeatCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
    <Card 
      className="group relative flex flex-row items-center p-4 py-3 gap-4 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/heartbeats/${heartbeat.id}`)}
    >
      <StatusDot status={heartbeat.paused ? "paused" : heartbeat.status} size="md" />
      
      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
        <h3 className="text-lg font-medium leading-tight truncate">
          {heartbeat.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Clock className="size-3" />
          <span>{formatPeriod(heartbeat.periodMinutes)}</span>
          <span className="opacity-50">·</span>
          <span>Grace {heartbeat.graceMinutes}m</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col items-end text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          <span>Last Ping</span>
          <span className="text-foreground normal-case font-mono">
            {heartbeat.lastPingAt 
              ? formatDistanceToNow(new Date(heartbeat.lastPingAt), { addSuffix: true })
              : "Never"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={copyPingUrl}>
              <Copy className="size-4 mr-2" /> Copy Ping URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onTogglePause} disabled={isLoading}>
              {heartbeat.paused ? (
                <><Play className="size-4 mr-2" /> Resume</>
              ) : (
                <><Pause className="size-4 mr-2" /> Pause</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/heartbeats/${heartbeat.id}`)}>
              <Edit2 className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete} 
              disabled={isLoading}
              variant="destructive"
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
