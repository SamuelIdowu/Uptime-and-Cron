import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PingCalendarProps {
  data?: number[]; // Assuming array of past 90 days, 1 is up, 0 is down
  className?: string;
}

export function PingCalendar({ data = Array(90).fill(1), className }: PingCalendarProps) {
  // Create a grid like GitHub's contribution graph
  // We'll just map them to flex row with wrapping or grid
  return (
    <div className={cn("grid grid-rows-7 grid-flow-col gap-[2px] auto-cols-max", className)}>
      {data.map((day, i) => {
        let colorClass = "bg-[var(--status-up)]";
        if (day < 0.99) colorClass = "bg-[var(--status-late)]";
        if (day < 0.95) colorClass = "bg-[var(--status-down)]";
        if (day === 0) colorClass = "bg-muted";

        return (
          <TooltipProvider key={i} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "w-3 h-3 rounded-lg opacity-80 hover:opacity-100 transition-colors hover:ring-1 hover:ring-ring hover:ring-offset-1 hover:ring-offset-background",
                    colorClass
                  )} 
                />
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-border shadow-md">
                <p className="text-[10px] uppercase font-semibold">Day {data.length - i} ago: {Math.round(day * 100)}% up</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
