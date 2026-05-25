"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea
} from "recharts";
import { cn } from "@/lib/utils";

interface ResponseTimeData {
  time: string;
  value: number;
  isDown?: boolean;
}

interface ResponseTimeChartProps {
  data: ResponseTimeData[];
  className?: string;
}

export function ResponseTimeChart({ data, className }: ResponseTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full h-[250px] bg-muted/50 rounded-xl flex items-center justify-center", className)}>
        <span className="text-muted-foreground text-sm font-medium">No data available yet</span>
      </div>
    );
  }

  // Find down regions to highlight
  const downRegions = [];
  let currentRegion: { start?: string; end?: string } | null = null;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i].isDown && !currentRegion) {
      currentRegion = { start: data[i].time };
    } else if (!data[i].isDown && currentRegion) {
      currentRegion.end = data[i - 1].time; // previous was the last down point
      downRegions.push(currentRegion);
      currentRegion = null;
    }
  }
  if (currentRegion) {
    currentRegion.end = data[data.length - 1].time;
    downRegions.push(currentRegion);
  }

  return (
    <div className={cn("w-full h-[250px] bg-card border border-border rounded-xl shadow-sm p-5", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
          {downRegions.map((region, i) => (
            <ReferenceArea 
              key={i} 
              x1={region.start} 
              x2={region.end} 
              fill="var(--status-down)" 
              fillOpacity={0.1}
              strokeOpacity={0} 
            />
          ))}
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'var(--font-sans)' }} 
            minTickGap={40}
            dy={15}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            domain={['dataMin - 10', 'dataMax + 20']} 
            dx={-10}
            tickFormatter={(val) => `${val}ms`}
          />
          <Tooltip 
            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border shadow-xl p-3 rounded-xl">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-primary" />
                      <p className="text-sm font-bold font-sans text-foreground">
                        {payload[0].value} ms
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="var(--primary)" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            strokeWidth={3}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
