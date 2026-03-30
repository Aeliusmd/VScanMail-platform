import { z } from "zod";

export const addManualCompanySchema = z.object({
  companyName:   z.string().min(2).max(200),
  industry:      z.string().min(1),
  email:         z.string().email(),
  phone:         z.string().default(""),
  status:        z.enum(["active", "pending"]).default("pending"),
  website:       z.string().optional(),
  address:       z.string().optional(),
  contactPerson: z.string().optional(),
  notes:         z.string().max(500).optional(),
  paymentType:   z.enum(["cash", "bank_transfer", "cheque", "other"]).default("other"),
});

export const updateSubscriptionSchema = z.object({
  subscriptionPlan:   z.enum(["starter", "professional", "enterprise", "custom", "none"]),
  subscriptionAmount: z.number().min(0).default(0),
  subscriptionStatus: z.enum(["active", "pending", "suspended"]).default("active"),
});

export type AddManualCompanyInput = z.infer<typeof addManualCompanySchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
