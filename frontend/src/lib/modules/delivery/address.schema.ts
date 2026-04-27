import { z } from "zod";

const countrySchema = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Country must be ISO-2");
const stateSchema = z.string().trim().min(2).max(32);
const zipSchema = z.string().trim().min(3).max(32);
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
  state: stateSchema,
  zip: zipSchema,
  country: countrySchema.default("US"),
  phone: phoneSchema,
  email: z.string().trim().email().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

export const createDeliveryAddressSchema = baseAddressSchema;
export const updateDeliveryAddressSchema = baseAddressSchema.partial();

export type CreateDeliveryAddressInput = z.infer<typeof createDeliveryAddressSchema>;
export type UpdateDeliveryAddressInput = z.infer<typeof updateDeliveryAddressSchema>;
