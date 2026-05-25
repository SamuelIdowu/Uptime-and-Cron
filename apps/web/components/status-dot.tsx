import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "up" | "down" | "late" | "paused" | "pending";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-3",
};

const statusMap = {
  up: "bg-status-up shadow-[0_0_8px_rgba(0,217,146,0.4)] animate-pulse",
  down: "bg-status-down shadow-[0_0_8px_rgba(239,68,68,0.4)]",
  late: "bg-status-late shadow-[0_0_8px_rgba(245,158,11,0.4)]",
  paused: "bg-status-paused",
  pending: "bg-status-pending",
};

export function StatusDot({ status, size = "md", className }: StatusDotProps) {
  return (
    <div
      aria-label={`Status: ${status}`}
      className={cn(
        "rounded-full shrink-0",
        sizeMap[size],
        statusMap[status],
        className
      )}
    />
  );
}
