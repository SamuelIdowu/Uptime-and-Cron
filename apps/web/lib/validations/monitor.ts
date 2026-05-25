import { z } from "zod";

export const monitorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  url: z.string().url("Invalid URL").max(2048, "URL is too long"),
  intervalMinutes: z.coerce.number().refine((val) => [1, 3, 5, 10, 15, 30, 60].includes(val), {
    message: "Invalid interval",
  }).default(5),
  expectedStatus: z.coerce.number().int().min(100).max(599).default(200),
  autoRetry: z.coerce.number().int().min(0).max(10).default(3),
  sslPolicy: z.enum(["strict", "standard", "none"]).default("strict"),
});

export const updateMonitorSchema = monitorSchema.partial().extend({
  paused: z.boolean().optional(),
});

export type MonitorInput = z.infer<typeof monitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
