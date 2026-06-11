import { DailyStatus } from "@/components/uptime-bar";
import { subDays, startOfDay, endOfDay, isSameDay } from "date-fns";

export function calculateUptimeBarData(
  createdAt: Date,
  lastCheckedAt: Date | null,
  paused: boolean,
  events: any[],
  rollups: any[],
  days = 30
): DailyStatus[] {
  const uptimeBarData: DailyStatus[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    // Check if we have a rollup for this day
    const rollup = rollups.find((r: any) => isSameDay(new Date(r.date), day));
    
    let barStatus: DailyStatus;

    if (rollup) {
      barStatus = parseFloat(rollup.uptimePercentage) >= 100 ? "up" : "down";
    } else {
      // Fallback for today or missing data: use live events
      const dayEvents = events.filter((e: any) => {
        const start = new Date(e.startedAt);
        const end = e.resolvedAt ? new Date(e.resolvedAt) : new Date();
        return (
          (start >= dayStart && start <= dayEnd) ||
          (end >= dayStart && end <= dayEnd) ||
          (start < dayStart && end > dayEnd)
        );
      });

      if (dayEvents.some((e: any) => e.status === "down")) {
        barStatus = "down";
      } else if (paused && lastCheckedAt && new Date(lastCheckedAt) < dayStart) {
        barStatus = "paused";
      } else if (new Date(createdAt) > dayEnd) {
        barStatus = "no-data";
      } else {
        barStatus = "up";
      }
    }

    uptimeBarData.push(barStatus);
  }

  return uptimeBarData;
}
