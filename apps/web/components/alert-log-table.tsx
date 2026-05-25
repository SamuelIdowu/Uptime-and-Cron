"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { ChevronRight, AlertTriangle, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "./empty-state";
import { AlertDetailModal } from "./modals/alert-detail-modal";

export interface AlertLog {
  id: string;
  displayId: string;
  monitorName: string;
  type: "DOWN" | "LATE" | "UP";
  time: string;
  channel: string;
  status: "sent" | "failed" | "pending";
  sentAt?: string;
  error?: string;
  retryCount: number;
}

export function AlertLogTable({ data }: { data: AlertLog[] }) {
  if (data.length === 0) {
    return (
      <EmptyState 
        icon={BellOff}
        title="No alerts triggered"
        description="All systems are fully operational. Alert history will appear here when an incident occurs and notifications are dispatched."
      />
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-[10px] font-bold text-mute uppercase tracking-widest w-10"></th>
              <th className="px-4 py-3 text-[10px] font-bold text-mute uppercase tracking-widest">Monitor</th>
              <th className="px-4 py-3 text-[10px] font-bold text-mute uppercase tracking-widest">Alert Type</th>
              <th className="px-4 py-3 text-[10px] font-bold text-mute uppercase tracking-widest">Channel</th>
              <th className="px-4 py-3 text-[10px] font-bold text-mute uppercase tracking-widest text-center">Status</th>
              <th className="px-4 py-3 text-[10px] font-bold text-mute uppercase tracking-widest text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((alert) => {
              const isFailed = alert.status === "failed";
              
              return (
                <AlertDetailModal
                  key={alert.id}
                  alert={alert}
                  trigger={
                    <tr className="group hover:bg-secondary/20 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        {isFailed ? (
                          <AlertTriangle className="size-3.5 text-status-down" />
                        ) : (
                          <ChevronRight className="size-3.5 text-mute" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-inkStrong">{alert.monitorName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge 
                          status={alert.type === "UP" ? "up" : alert.type === "DOWN" ? "down" : "late"}
                          className="text-[10px]"
                        >
                          {alert.type}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-mute uppercase tracking-wider">{alert.channel}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                          isFailed ? "bg-status-down/10 text-status-down border border-status-down/20" : "bg-status-up/10 text-status-up border border-status-up/20"
                        )}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-[11px] text-mute font-mono">
                          {formatDistanceToNow(new Date(alert.time), { addSuffix: true })}
                        </span>
                      </td>
                    </tr>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
