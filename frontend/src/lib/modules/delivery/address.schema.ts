import { z } from "zod";

/** USPS-oriented checks aligned with vSendDocs mailing requirements */
const US_STATE_RE = /^[A-Z]{2}$/;
const US_ZIP_RE = /^[0-9]{5}(-[0-9]{4})?$/;

export function isUspsMailingAddress(input: { country: string; state: string; zip: string }): boolean {
  const c = String(input.country ?? "")
    .trim()
    .toUpperCase();
  if (c !== "US") return false;
  const st = String(input.state ?? "")
    .trim()
    .toUpperCase();
  if (!US_STATE_RE.test(st)) return false;
  const zip = String(input.zip ?? "").trim();
  if (!US_ZIP_RE.test(zip)) return false;
  return true;
}

const usCountrySchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .refine((c) => c === "US", {
    message: "Country must be US for physical mail sent via USPS (vSendDocs).",
  });

const usStateSchema = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase())
  .refine((s) => US_STATE_RE.test(s), {
    message: "State must be a 2-letter US state code (e.g. CA) for USPS mail (vSendDocs).",
  });

const usZipSchema = z
  .string()
  .trim()
  .regex(US_ZIP_RE, {
    message: "ZIP must be 5 digits or ZIP+4 (e.g. 12345 or 12345-6789) for USPS delivery.",
  });

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9()\-\s]{7,20}$/, "Phone number format is invalid")
  .optional()
  .nullable();

const baseAddressSchema = z.object({
  label: z.string().trim().min(2).max(64),
  recipientName: z.string().trim().min(2).max(128),
  line1: z.string().trim().min(3).max(255),
  line2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(2).max(128),
  state: usStateSchema,
  zip: usZipSchema,
  country: usCountrySchema.default("US"),
  phone: phoneSchema,
  email: z.string().trim().email().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

export const createDeliveryAddressSchema = baseAddressSchema;

export const updateDeliveryAddressSchema = baseAddressSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.country !== undefined) {
      const c = String(data.country).trim().toUpperCase();
      if (c !== "US") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Country must be US for physical mail (USPS / vSendDocs).",
          path: ["country"],
        });
      }
    }
    if (data.state !== undefined) {
      const s = String(data.state).trim().toUpperCase();
      if (!US_STATE_RE.test(s)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State must be a 2-letter US state code for USPS mail.",
          path: ["state"],
        });
      }
    }
    if (data.zip !== undefined) {
      const zip = String(data.zip).trim();
      if (!US_ZIP_RE.test(zip)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ZIP must be 5 digits or ZIP+4 for USPS delivery.",
          path: ["zip"],
        });
      }
    }
  });

export type CreateDeliveryAddressInput = z.infer<typeof createDeliveryAddressSchema>;
export type UpdateDeliveryAddressInput = z.infer<typeof updateDeliveryAddressSchema>;
