import { z } from "zod";

export const approveSchema = z.object({
  reason: z.string().optional().default("Client approved"),
});

export const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});
