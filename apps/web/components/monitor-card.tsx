"use client";

import { Monitor } from "@steady-state/db";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import { MoreVertical, ExternalLink, Pause, Play, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface MonitorCardProps {
  monitor: Monitor;
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onTogglePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await fetch(`/api/monitors/${monitor.id}`, {
        method: "PATCH",
        body: JSON.stringify({ paused: !monitor.paused }),
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
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    setIsLoading(true);
    try {
      await fetch(`/api/monitors/${monitor.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className="group relative flex flex-row items-center p-4 py-3 gap-4 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/monitors/${monitor.id}`)}
    >
      <StatusDot status={monitor.paused ? "paused" : monitor.status} size="md" />
      
      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
        <h3 className="text-lg font-medium leading-tight truncate">
          {monitor.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <span className="truncate max-w-[200px] sm:max-w-[400px]">
            {monitor.url}
          </span>
          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-8 text-sm font-mono whitespace-nowrap px-4">
        <div className="flex flex-col items-end">
          <span className="text-foreground">
            {monitor.uptime7d ? `${monitor.uptime7d}%` : "--%"}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            7D Uptime
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-foreground">
            {monitor.avgResponseMs ? `${monitor.avgResponseMs}ms` : "--ms"}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Avg Resp
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col items-end text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          <span>Checked</span>
          <span className="text-foreground normal-case font-mono">
            {monitor.lastCheckedAt 
              ? formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })
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
            <DropdownMenuItem onClick={onTogglePause} disabled={isLoading}>
              {monitor.paused ? (
                <><Play className="size-4 mr-2" /> Resume</>
              ) : (
                <><Pause className="size-4 mr-2" /> Pause</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/monitors/${monitor.id}`)}>
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
