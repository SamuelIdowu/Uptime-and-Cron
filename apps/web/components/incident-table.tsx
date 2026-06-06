"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { ChevronDown, ChevronRight, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { EmptyState } from "./empty-state";

export interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "critical" | "warning" | "info";
  createdAt: string;
  service: string;
  updates: { time: string; text: string }[];
}

export function IncidentTable({ data = [] }: { data?: Incident[] }) {
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
        icon={<ShieldCheck className="size-6" />}
        title="100% Uptime Maintained"
        description="No recent incidents or outages detected for this monitor. All systems are operating normally."
      />
    );
  }

  return (
    <div className="w-full border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest w-10"></th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Incident</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((incident) => {
              const isExpanded = expandedRows.has(incident.id);
              const isResolved = incident.status === "resolved";
              return (
                <React.Fragment key={incident.id}>
                  <tr 
                    className="group hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(incident.id)}
                  >
                    <td className="px-6 py-4">
                      {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] uppercase text-muted-foreground tracking-widest">{incident.id}</td>
                    <td className="px-6 py-4 font-semibold text-sm text-foreground truncate">{incident.title}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center justify-center gap-1 w-max",
                        isResolved ? "bg-status-up/10 text-status-up ring-1 ring-status-up/20" : "bg-status-down/10 text-status-down ring-1 ring-status-down/20"
                      )}>
                        {isResolved ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 bg-secondary/30">
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4 max-w-3xl ml-4"
                        >
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Updates</h4>
                          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                            {incident.updates.length === 0 ? (
                              <p className="text-sm text-muted-foreground pl-6">No updates posted yet.</p>
                            ) : (
                              incident.updates.map((update, idx) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center size-3 rounded-full bg-background ring-2 ring-border shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow" />
                                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-card border border-border p-4 rounded-xl shadow-inner">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Update</span>
                                      <time className="text-[10px] font-mono text-muted-foreground">{new Date(update.time).toLocaleTimeString()}</time>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">{update.text}</p>
                                  </div>
                                </div>
                              ))
                            )}
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
