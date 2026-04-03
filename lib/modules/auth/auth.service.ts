import { clientModel } from "@/lib/modules/clients/client.model";
import { generateClientCode, generateClientTableName } from "@/lib/modules/clients/client-code";
import { stripeService } from "../billing/stripe.service";
import { notificationService } from "../notifications/notification.service";
import { auditService } from "../audit/audit.service";
import type { RegisterInput } from "./auth.schema";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { db } from "@/lib/modules/core/db/mysql";
import { emailVerifications, profiles, users, clients } from "@/lib/modules/core/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { createClientTable } from "@/lib/modules/core/db/dynamic-table";

export const authService = {
  async register(input: RegisterInput, req?: Request) {
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

    // 3. Generate unique client code and OTP and TableName
    const clientCode = generateClientCode();
    const tableName = generateClientTableName(clientCode);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Wrap all DB operations in a single transaction
    await db.transaction(async (tx) => {
      // 1) Create user
      await tx.insert(users).values({
        id: userId,
        email: input.email,
        passwordHash,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      });

      // 2) Insert client record directly
      await tx.insert(clients).values({
        id: userId,
        clientCode: clientCode,
        tableName: tableName,
        companyName: input.companyName,
        registrationNo: input.registrationNo || undefined,
        industry: input.industry,
        email: input.email,
        phone: input.phone,
        addressJson: input.address as any,
        clientType: "subscription",
        status: "pending",
        twoFaEnabled: false,
        twoFaSecret: undefined,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      });

      // 3) Create profile for RBAC
      await tx.insert(profiles).values({
        id: crypto.randomUUID(),
        userId,
        role: "client",
        clientId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4) Create email verification record
      await tx.insert(emailVerifications).values({
        id: crypto.randomUUID(),
        email: input.email,
        otp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      });
    });

    // 5) Create dynamic table for the client
    try {
      await createClientTable(tableName);
    } catch (err) {
      console.error("Failed to create dynamic table for client", err);
      // In production, you might want to rollback the user creation here or have a retry mechanism.
    }

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
      actor_role: "client",
      action: "client.registered",
      entity: userId,
      after: { clientCode, planType: input.planType, tableName },
      req,
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
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!rows[0]) throw new Error("Invalid or expired OTP");

    // Mark user verified in both users and clients table directly by email
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.email, email));
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
