import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ActivityHeatmap({ data = Array(30).fill(1) }: { data?: number[] }) {
  // data is an array of 30 items, where 1 means 100% up, 0 means down, etc.
  return (
    <div className="flex gap-1 items-center">
      {data.map((day, i) => {
        let color = "bg-[#00FF00]";
        if (day < 0.99) color = "bg-[#FFE600]";
        if (day < 0.95) color = "bg-[#FF003C]";
        if (day === 0) color = "bg-gray-800";
        
        return (
          <TooltipProvider key={i} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <div className={`w-2 h-6 ${color} opacity-80 hover:opacity-100 hover:scale-y-110 transition-transform shadow-[0_0_2px_currentColor]`} />
              </TooltipTrigger>
              <TooltipContent className="bg-black border-2 border-white text-white font-mono text-xs rounded-lg shadow-[4px_4px_0px_0px_#00E5FF]">
                <p>Day {30 - i} ago: {Math.round(day * 100)}% uptime</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
