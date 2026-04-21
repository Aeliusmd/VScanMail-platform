import { z } from "zod";

export const bankAccountTypeSchema = z.enum(["checking", "savings"]);

function onlyDigits(s: string): string {
  return String(s || "").replace(/\D/g, "");
}

export const createBankAccountSchema = z
  .object({
    bankName: z.string().trim().min(2).max(128),
    nickname: z.string().trim().min(2).max(64),
    accountType: bankAccountTypeSchema,
    accountNumber: z
      .string()
      .transform((v) => onlyDigits(v))
      .refine((v) => v.length >= 4 && v.length <= 17, {
        message: "Account number must be 4–17 digits",
      }),
    isPrimary: z.boolean().optional().default(false),
  });

export const setPrimaryBankAccountSchema = z.object({
  id: z.string().uuid(),
});

export const deleteBankAccountSchema = z.object({
  password: z.string().min(8).max(200),
});

export const revealBankAccountSchema = z.object({
  totpCode: z.string().min(6).max(16),
  reason: z.string().trim().min(3).max(200),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type DeleteBankAccountInput = z.infer<typeof deleteBankAccountSchema>;
export type RevealBankAccountInput = z.infer<typeof revealBankAccountSchema>;

