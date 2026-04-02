import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().min(2).max(200),
  registrationNo: z.string().optional(),
  industry: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
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
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
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
