import { z } from "zod";

export const statusPageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug is too long").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description is too long").optional(),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  published: z.boolean().default(false),
  themeConfig: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color hex").optional(),
    headerText: z.string().max(100).optional(),
  }).optional(),
  monitorIds: z.array(z.string().uuid()).optional(),
});

export const updateStatusPageSchema = statusPageSchema.partial();

export type StatusPageInput = z.infer<typeof statusPageSchema>;
export type UpdateStatusPageInput = z.infer<typeof updateStatusPageSchema>;
