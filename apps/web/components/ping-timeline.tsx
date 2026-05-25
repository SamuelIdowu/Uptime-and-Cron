import { cn } from "@/lib/utils";

export type PingStatus = "up" | "down" | "late" | "no-data";

interface PingTimelineProps {
  data?: PingStatus[];
  maxItems?: number;
  className?: string;
}

export function PingTimeline({ data = [], maxItems = 20, className }: PingTimelineProps) {
  // Pad with no-data
  const paddedData = [...Array(Math.max(0, maxItems - data.length)).fill("no-data"), ...data].slice(-maxItems);

  return (
    <div className={cn("flex items-end gap-[2px] h-6 w-24", className)}>
      {paddedData.map((status, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 w-1 rounded-lg transition-colors",
            status === "up" && "bg-[var(--status-up)] hover:bg-[var(--status-up)]/80 h-full",
            status === "down" && "bg-[var(--status-down)] hover:bg-[var(--status-down)]/80 h-2/3",
            status === "late" && "bg-[var(--status-late)] hover:bg-[var(--status-late)]/80 h-4/5",
            status === "no-data" && "bg-muted h-1/3"
          )}
          title={`Ping ${maxItems - i} ago: ${status.toUpperCase()}`}
        />
      ))}
    </div>
  );
}
