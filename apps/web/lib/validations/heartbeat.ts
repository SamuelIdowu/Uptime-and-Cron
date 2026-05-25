import { z } from "zod";

export const heartbeatSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  periodMinutes: z.coerce.number().int().min(1).max(525600), // Up to 1 year
  graceMinutes: z.coerce.number().int().min(0).max(10080), // Up to 1 week
});

export const updateHeartbeatSchema = heartbeatSchema.partial().extend({
  paused: z.boolean().optional(),
});

export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type UpdateHeartbeatInput = z.infer<typeof updateHeartbeatSchema>;
