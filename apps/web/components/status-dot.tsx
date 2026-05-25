import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "up" | "down" | "late" | "paused" | "pending";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
};

const statusMap = {
  up: "bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse",
  down: "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse [animation-duration:1s]",
  late: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse [animation-duration:1.5s]",
  paused: "bg-muted-foreground",
  pending: "bg-blue-500",
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
