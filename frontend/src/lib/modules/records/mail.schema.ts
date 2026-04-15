import { z } from "zod";

export const uploadMailSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(["letter", "cheque", "package", "legal"]),
  notes: z.string().optional(),
});

export const annotateSchema = z.object({
  annotations: z.any(), // Fabric.js canvas JSON — flexible structure
  tamperDetected: z.boolean(),
  tamperNotes: z.string().optional(),
});

export const mailQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(["letter", "cheque", "package", "legal"]).optional(),
  status: z.enum(["received", "scanned", "processed", "delivered"]).optional(),
  search: z.string().optional(),
  archived: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
