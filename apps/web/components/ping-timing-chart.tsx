"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";

interface PingTimingData {
  time: string;
  delayMs: number; // positive = late, negative = early, 0 = on time
  status: "up" | "late" | "down";
}

interface PingTimingChartProps {
  data: PingTimingData[];
  className?: string;
}

export function PingTimingChart({ data, className }: PingTimingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full h-[200px] bg-muted flex items-center justify-center", className)}>
        <span className="text-muted-foreground text-xs">No data yet</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-[200px] bg-card border border-border shadow-sm p-4", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <pattern id="gridPatternBar" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--chart-grid)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPatternBar)" />
          
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
          
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-sans)' }} 
            minTickGap={30}
            dy={10}
          />
          <YAxis 
            hide={true} 
            domain={['dataMin - 10', 'dataMax + 10']} 
          />
          <Tooltip 
            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const dataPoint = payload[0].payload as PingTimingData;
                const delayStr = dataPoint.delayMs > 0 
                  ? `+${dataPoint.delayMs}ms (Late)` 
                  : dataPoint.delayMs < 0 
                    ? `${dataPoint.delayMs}ms (Early)` 
                    : `On time`;
                    
                return (
                  <div className="bg-popover border border-border shadow-md p-2 rounded-lg">
                    <p className="text-[10px] uppercase text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-bold font-sans text-foreground">
                      {delayStr}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="delayMs" radius={0} isAnimationActive={false}>
            {data.map((entry, index) => {
              let color = "var(--status-up)";
              if (entry.status === "down") color = "var(--status-down)";
              else if (entry.status === "late") color = "var(--status-late)";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
