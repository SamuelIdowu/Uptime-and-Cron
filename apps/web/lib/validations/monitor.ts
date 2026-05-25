import { z } from "zod";

export const monitorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  url: z.string().url("Invalid URL").max(2048, "URL is too long").optional().nullable(),
  targets: z.array(z.object({
    url: z.string().url("Invalid URL")
  })).min(1, "At least one target is required").max(5, "Max 5 targets"),
  healthThreshold: z.enum(["any", "all", "quorum"]),
  intervalMinutes: z.coerce.number().refine((val) => [1, 3, 5, 10, 15, 30, 60].includes(val), {
    message: "Invalid interval",
  }),
  expectedStatus: z.coerce.number().int().min(100).max(599),
  autoRetry: z.coerce.number().int().min(0).max(10),
  sslPolicy: z.enum(["strict", "standard", "none"]),
});

export const updateMonitorSchema = monitorSchema.partial().extend({
  paused: z.boolean().optional(),
});

export type MonitorInput = z.infer<typeof monitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
