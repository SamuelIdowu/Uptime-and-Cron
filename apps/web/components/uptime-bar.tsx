import { cn } from "@/lib/utils";

export type DailyStatus = "up" | "down" | "paused" | "no-data";

interface UptimeBarProps {
  data: DailyStatus[];
  className?: string;
}

export function UptimeBar({ data, className }: UptimeBarProps) {
  // Pad data to ensure 30 segments if less provided (e.g., new monitor)
  const paddedData = [...Array(Math.max(0, 30 - data.length)).fill("no-data"), ...data].slice(-30);

  return (
    <div className={cn("flex items-center gap-[2px] h-8 w-full", className)}>
      {paddedData.map((status, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-full rounded-lg transition-colors",
            status === "up" && "bg-[var(--status-up)] hover:bg-[var(--status-up)]/80",
            status === "down" && "bg-[var(--status-down)] hover:bg-[var(--status-down)]/80",
            status === "paused" && "bg-[var(--status-paused)] hover:bg-[var(--status-paused)]/80",
            status === "no-data" && "bg-muted"
          )}
          title={`Day ${30 - i} ago: ${status.toUpperCase()}`}
        />
      ))}
    </div>
  );
}
