import { z } from "zod";

export const teamInviteSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "viewer"], {
    required_error: "Please select a role",
  }),
});

export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
