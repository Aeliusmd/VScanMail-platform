import { z } from "zod";

export const topupSchema = z.object({
  amount: z.number().min(10).max(10000), // $10 to $10,000
});

export const usageQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
