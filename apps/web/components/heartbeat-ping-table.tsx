"use client";

import React, { useState } from "react";
import { StatusBadge } from "./status-badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Terminal, Clock, Shield, Globe } from "lucide-react";

interface Ping {
  id: string;
  receivedAt: Date;
  sourceIp: string | null;
  durationMs: number | null;
  exitCode: number | null;
  log: string | null;
}

export function HeartbeatPingTable({ pings }: { pings: Ping[] }) {
  const [selectedPing, setSelectedPing] = useState<Ping | null>(null);

  return (
    <>
      <div className="bg-background border border-border rounded-md overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-secondary/30 border-b border-border eyebrow text-[10px] text-mute">
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Source IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {pings.map((ping) => (
              <tr
                key={ping.id}
                className="hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => setSelectedPing(ping)}
              >
                <td className="px-6 py-5 text-sm font-bold text-ink font-mono tracking-tight">
                  {format(new Date(ping.receivedAt), "MMM d, HH:mm:ss")}
                </td>
                <td className="px-6 py-5 text-center">
                  <StatusBadge
                    status={
                      ping.exitCode === 0 || ping.exitCode === null
                        ? "up"
                        : "down"
                    }
                  >
                    {ping.exitCode === 0 || ping.exitCode === null
                      ? "Success"
                      : "Failed"}
                  </StatusBadge>
                </td>
                <td className="px-6 py-5 text-sm text-mute font-mono">
                  {ping.durationMs ? `${ping.durationMs}ms` : "-"}
                </td>
                <td className="px-6 py-5 font-mono text-[11px] text-mute text-right uppercase tracking-tighter">
                  {ping.sourceIp || "Internal Node"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedPing} onOpenChange={(open) => !open && setSelectedPing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="size-5 text-primary" />
              Execution Details
            </DialogTitle>
            <DialogDescription>
              Metadata and logs for the selected check-in.
            </DialogDescription>
          </DialogHeader>

          {selectedPing && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-secondary/30 rounded-md border border-border">
                  <div className="flex items-center gap-1.5 mb-1 text-mute">
                    <Clock className="size-3" />
                    <span className="eyebrow text-[9px]">Time</span>
                  </div>
                  <p className="text-xs font-bold font-mono text-inkStrong">
                    {format(new Date(selectedPing.receivedAt), "HH:mm:ss")}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-md border border-border">
                  <div className="flex items-center gap-1.5 mb-1 text-mute">
                    <Shield className="size-3" />
                    <span className="eyebrow text-[9px]">Exit Code</span>
                  </div>
                  <p className="text-xs font-bold font-mono text-inkStrong">
                    {selectedPing.exitCode !== null ? selectedPing.exitCode : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-md border border-border">
                  <div className="flex items-center gap-1.5 mb-1 text-mute">
                    <Terminal className="size-3" />
                    <span className="eyebrow text-[9px]">Duration</span>
                  </div>
                  <p className="text-xs font-bold font-mono text-inkStrong">
                    {selectedPing.durationMs ? `${selectedPing.durationMs}ms` : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-md border border-border">
                  <div className="flex items-center gap-1.5 mb-1 text-mute">
                    <Globe className="size-3" />
                    <span className="eyebrow text-[9px]">Source</span>
                  </div>
                  <p className="text-xs font-bold font-mono text-inkStrong">
                    {selectedPing.sourceIp || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="eyebrow text-[10px] text-mute flex items-center gap-2">
                    <Terminal className="size-3" />
                    Console Output
                  </h3>
                  {selectedPing.log && (
                    <span className="text-[10px] text-mute font-mono opacity-50">
                      {selectedPing.log.length} bytes
                    </span>
                  )}
                </div>
                <div className="bg-inkStrong rounded-md p-4 overflow-x-auto max-h-[400px] border border-border/10">
                  <pre className="text-[11px] font-mono text-primary-soft leading-relaxed whitespace-pre-wrap break-all">
                    {selectedPing.log || "No log output available for this execution."}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
