"use client";

import { Monitor, MonitorCheck } from "@steady-state/db";
import { StatusDot } from "@/components/status-dot";
import { MiniSparkline } from "@/components/sparkline";
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
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface MonitorCardProps {
  monitor: Monitor & { checks?: MonitorCheck[] };
  workspaceId: string;
}

export function MonitorCard({ monitor, workspaceId }: MonitorCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const sparklineData = monitor.checks
    ?.map((c) => c.responseMs || 0)
    .reverse();

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

  const sslDays = monitor.sslExpiryAt 
    ? Math.max(0, Math.floor((new Date(monitor.sslExpiryAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div 
      className="group relative flex flex-row items-center p-4 py-3 gap-4 bg-card border border-border hover:border-primary transition-all cursor-pointer rounded-md shadow-sm hover:translate-y-[-1px]"
      onClick={() => router.push(`/${workspaceId}/monitors/${monitor.id}`)}
    >
      <StatusDot status={monitor.paused ? "paused" : monitor.status} size="md" className="border border-border" />
      
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <h3 className="text-[20px] font-semibold tracking-tight text-foreground truncate">
          {monitor.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="truncate max-w-[200px] sm:max-w-[300px]">
            {monitor.url}
          </span>
          {sslDays !== null && (
            <span className={cn(
              "px-2 py-0.5 border rounded-pill text-[10px] font-bold uppercase",
              sslDays < 14 ? 'border-destructive text-destructive' : 'border-border text-muted-foreground'
            )}>
              SSL: {sslDays}D
            </span>
          )}
        </div>
      </div>

      <div className="hidden md:block px-4 border-l border-dashed border-border/40">
        <MiniSparkline status={monitor.status} data={sparklineData} />
      </div>

      <div className="hidden sm:flex items-center gap-8 text-sm whitespace-nowrap px-4 border-l border-dashed border-border/40 h-full">
        <div className="flex flex-col items-end">
          <span className="text-foreground font-bold font-mono text-lg">
            {monitor.uptime7d ? `${monitor.uptime7d}%` : "--%"}
          </span>
          <span className="eyebrow text-[10px] text-muted-foreground">
            7D Uptime
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-foreground font-bold font-mono text-lg">
            {monitor.avgResponseMs ? `${monitor.avgResponseMs}ms` : "--ms"}
          </span>
          <span className="eyebrow text-[10px] text-muted-foreground">
            Avg Resp
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-l border-dashed border-border/40 pl-4">
        <div className="hidden lg:flex flex-col items-end whitespace-nowrap">
          <span className="eyebrow text-[10px] text-muted-foreground">Checked</span>
          <span className="text-foreground text-xs font-mono">
            {monitor.lastCheckedAt 
              ? formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })
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
            <DropdownMenuItem onClick={onTogglePause} disabled={isLoading} className="text-foreground eyebrow text-[12px] hover:bg-accent focus:bg-accent cursor-pointer">
              {monitor.paused ? (
                <><Play className="size-4 mr-2" /> Resume</>
              ) : (
                <><Pause className="size-4 mr-2" /> Pause</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/${workspaceId}/monitors/${monitor.id}`)} className="text-foreground eyebrow text-[12px] hover:bg-accent focus:bg-accent cursor-pointer">
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
