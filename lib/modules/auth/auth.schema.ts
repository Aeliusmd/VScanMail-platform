import { z } from "zod";

const US_PHONE_RE = /^(\+1 \(\d{3}\) \d{3}-\d{4}|\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/;
const PHONE_MSG = "Use format: +1 (XXX) XXX-XXXX, (XXX) XXX-XXXX, or XXX-XXX-XXXX";

export const registerSchema = z.object({
  companyName: z.string().min(2).max(200),
  registrationNo: z.string().optional(),
  industry: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(US_PHONE_RE, PHONE_MSG),
  password: z.string().min(8),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }),
  planType: z.enum(["subscription", "topup"]),
  planTier: z.enum(["starter", "professional", "enterprise"]).optional(),
  contactName: z.string().max(255).optional(),
  contactJob: z.string().max(255).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().refine(v => !v || US_PHONE_RE.test(v), PHONE_MSG).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
  rememberMe: z.boolean().optional().default(false),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const setup2faSchema = z.object({
  totpCode: z.string().length(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
