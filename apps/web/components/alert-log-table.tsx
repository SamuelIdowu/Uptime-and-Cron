"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { ChevronDown, ChevronRight, AlertTriangle, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { EmptyState } from "./empty-state";

export interface AlertLog {
  id: string;
  monitor: string;
  type: "DOWN" | "LATE" | "UP";
  time: string;
  channel: string;
  status: "sent" | "failed" | "pending";
}

export function AlertLogTable({ data }: { data: AlertLog[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

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
              const isExpanded = expandedRows.has(alert.id);
              const isFailed = alert.status === "failed";
              
              return (
                <React.Fragment key={alert.id}>
                  <tr 
                    className="group hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => toggleRow(alert.id)}
                  >
                    <td className="px-4 py-3">
                      {isFailed ? (
                        <AlertTriangle className="size-3.5 text-status-down" />
                      ) : isExpanded ? (
                        <ChevronDown className="size-3.5 text-mute" />
                      ) : (
                        <ChevronRight className="size-3.5 text-mute" />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-inkStrong">{alert.monitor}</span>
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
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-secondary/10">
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-secondary/30 border border-border p-3 rounded-sm font-mono text-[10px]"
                        >
                          <div className={cn(
                            "flex flex-col gap-1 border-l-2 pl-3",
                            isFailed ? "border-status-down/50" : "border-status-up/50"
                          )}>
                            <p className="text-mute">{`[${new Date(alert.time).toISOString()}] [INFO] Initiating delivery.`}</p>
                            <p className={isFailed ? "text-status-down" : "text-status-up"}>
                              {isFailed ? "Delivery failed after multiple attempts." : "Successfully delivered to recipient."}
                            </p>
                            <p className="text-mute mt-1.5 opacity-60">LOG_ID: {alert.id}</p>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
