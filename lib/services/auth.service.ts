import { clientModel } from "@/lib/models/client.model";
import { generateClientCode } from "@/lib/utils/client-code";
import { stripeService } from "./stripe.service";
import { notificationService } from "./supporting.services";
import { auditService } from "./supporting.services";
import type { RegisterInput } from "@/lib/validators/auth.schema";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/mysql";
import { emailVerifications, profiles, users, clients, companyDirectory } from "@/lib/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export const authService = {
  async register(input: RegisterInput) {
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);

    // 2. Create Stripe customer (dev tolerance)
    let stripeCustomerId: string | null = null;
    try {
      const stripeCustomer = await stripeService.createCustomer(
        input.email,
        input.companyName
      );
      stripeCustomerId = stripeCustomer.id;
    } catch (err: any) {
      console.warn("Stripe customer creation failed; continuing:", err?.message || err);
      stripeCustomerId = null;
    }

    // 3. Generate unique client code and OTP
    const clientCode = generateClientCode();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Wrap all DB operations in a single transaction
    await db.transaction(async (tx) => {
      // 1) Create user
      await tx.insert(users).values({
        id: userId,
        email: input.email,
        passwordHash,
        emailVerifiedAt: null,
        createdAt: sql`NOW()`,
      });

      // 4) Insert client record directly
      await tx.insert(clients).values({
        id: userId,
        clientCode: clientCode,
        companyName: input.companyName,
        registrationNo: input.registrationNo || undefined,
        industry: input.industry,
        email: input.email,
        phone: input.phone,
        addressJson: input.address as any,
        stripeCustomerId: stripeCustomerId || undefined,
        planType: input.planType,
        planTier: (input.planTier as any) || undefined,
        walletBalance: "0",
        status: "pending",
        twoFaEnabled: false,
        twoFaSecret: undefined,
        createdAt: sql`NOW()` as any,
      });

      // 5) Create profile for RBAC
      await tx.insert(profiles).values({
        id: crypto.randomUUID(),
        userId,
        role: "client",
        clientId: userId,
        createdAt: sql`NOW()`,
      });

      // 6) Add to company_directory so this company appears in unified lookup
      await tx.insert(companyDirectory).values({
        id: crypto.randomUUID(),
        sourceType: "client",
        sourceId: userId,
        companyName: input.companyName,
        email: input.email,
        industry: input.industry,
        phone: input.phone,
        status: "pending",
        createdAt: sql`NOW()` as any,
      });

      // 6) Create email verification record
      await tx.insert(emailVerifications).values({
        id: crypto.randomUUID(),
        email: input.email,
        otp,
        expiresAt: sql`DATE_ADD(NOW(), INTERVAL 15 MINUTE)`,
        createdAt: sql`NOW()`,
      });
    });

    try {
      await notificationService.sendVerificationEmail(input.email, otp);
    } catch (err: any) {
      // Don't leave an OTP that the user never received.
      await db
        .delete(emailVerifications)
        .where(and(eq(emailVerifications.email, input.email), eq(emailVerifications.otp, otp)));
      throw err;
    }

    // 7. Audit log
    await auditService.log({
      actor: userId,
      action: "client.registered",
      entity: userId,
      details: { clientCode, planType: input.planType },
    });

    return { clientId: userId, clientCode };
  },

  async verifyEmail(email: string, otp: string) {
    const rows = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.otp, otp),
          gt(emailVerifications.expiresAt, sql`NOW()`)
        )
      )
      .limit(1);

    if (!rows[0]) throw new Error("Invalid or expired OTP");

    // Mark user verified in both users and clients table directly by email
    await db.update(users).set({ emailVerifiedAt: sql`NOW()` }).where(eq(users.email, email));
    await db.update(clients).set({ status: "active" }).where(eq(clients.email, email));

    // Clean up
    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

    return { verified: true };
  },

  async setup2FA(userId: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      userId,
      "VScanMail",
      secret
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (confirm on first valid TOTP)
    await clientModel.update(userId, { two_fa_secret: secret });

    return { qrCode: qrCodeDataUrl, secret };
  },

  async confirm2FA(userId: string, totpCode: string) {
    const client = await clientModel.findById(userId);
    if (!client.two_fa_secret) throw new Error("2FA not initialized");

    const isValid = authenticator.verify({
      token: totpCode,
      secret: client.two_fa_secret,
    });

    if (!isValid) throw new Error("Invalid TOTP code");

    await clientModel.update(userId, { two_fa_enabled: true });
    return { enabled: true };
  },

  async verify2FA(userId: string, totpCode: string) {
    const client = await clientModel.findById(userId);
    if (!client.two_fa_enabled || !client.two_fa_secret) return true;

    return authenticator.verify({
      token: totpCode,
      secret: client.two_fa_secret,
    });
  },
};
