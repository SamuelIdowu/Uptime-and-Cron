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
            "flex-1 h-full rounded-[1px] transition-colors",
            status === "up" && "bg-primary/80 hover:bg-primary",
            status === "down" && "bg-destructive/80 hover:bg-destructive",
            status === "paused" && "bg-muted-foreground/30 hover:bg-muted-foreground/50",
            status === "no-data" && "bg-muted/30"
          )}
          title={`Day ${30 - i} ago: ${status.toUpperCase()}`}
        />
      ))}
    </div>
  );
}
