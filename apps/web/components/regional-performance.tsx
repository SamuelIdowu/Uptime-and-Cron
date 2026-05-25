"use client";

import { motion } from "framer-motion";

export interface Region {
  id: string;
  name: string;
  latency: number; // ms
  status: "up" | "degraded" | "down";
}

export function RegionalPerformance({ regions = [] }: { regions?: Region[] }) {
  if (regions.length === 0) {
    return (
      <div className="p-12 bg-card border border-border rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <svg className="size-6 text-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Global edge network coming soon</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Currently checking from primary region only</p>
      </div>
    );
  }

  const maxLatency = Math.max(...regions.map((r) => r.latency));

  return (
    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
      <div className="grid gap-4">
        {regions.map((region, idx) => {
          const percentage = Math.max(5, (region.latency / maxLatency) * 100);
          const isDegraded = region.status !== "up";

          return (
            <div key={region.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{region.name}</span>
                <span className={`font-mono ${isDegraded ? 'text-status-down' : 'text-muted-foreground'}`}>
                  {region.latency}ms
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-full shadow-[0_0_8px_currentColor] ${
                    isDegraded ? "bg-status-down text-status-down" : "bg-primary text-primary"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
