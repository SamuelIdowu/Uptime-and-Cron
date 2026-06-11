import { z } from "zod";

const baseMaintenanceSchema = z.object({
  monitorId: z.string().uuid().optional().nullable(),
  heartbeatId: z.string().uuid().optional().nullable(),
  startTime: z.string().pipe(z.coerce.date()),
  endTime: z.string().pipe(z.coerce.date()),
  reason: z.string().max(500, "Reason is too long").optional().nullable(),
});

export const maintenanceSchema = baseMaintenanceSchema.refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const updateMaintenanceSchema = baseMaintenanceSchema.partial().refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
