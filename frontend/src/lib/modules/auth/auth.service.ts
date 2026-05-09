import { clientModel } from "@/lib/modules/clients/client.model";
import { generateClientCode, generateClientTableName } from "@/lib/modules/clients/client-code";
import { stripeService } from "../billing/stripe.service";
import { notificationService } from "../notifications/notification.service";
import { auditService } from "../audit/audit.service";
import { sendEmail } from "../notifications/email.client";
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
      clientId: userId,
      after: { clientCode, planType: input.planType, tableName },
      req,
    });


    return { clientId: userId, clientCode };
  },

  async verifyEmail(email: string, otp: string, req?: Request) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    const userId = rows[0]?.id;

    const verificationRows = await db
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

    if (!verificationRows[0]) throw new Error("Invalid or expired OTP");

    const clientRows = await db
      .select({ id: clients.id, clientType: clients.clientType })
      .from(clients)
      .where(eq(clients.email, email))
      .limit(1);
    const clientRow = clientRows[0];

    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.email, email));

    // Subscription orgs stay pending until Stripe checkout.session.completed activates them.
    if (clientRow?.clientType !== "subscription") {
      await db.update(clients).set({ status: "active" }).where(eq(clients.email, email));
    }

    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

    if (userId) {
      await auditService.log({
        actor: userId,
        actor_role: "client",
        action: "auth.email_verified",
        entity: userId,
        clientId: userId,
        req,
      });
    }

    return { verified: true, clientId: userId ?? clientRow?.id ?? null };
  },

  async setup2FA(userId: string, req?: Request) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      userId,
      "VScanMail",
      secret
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (confirm on first valid TOTP)
    await clientModel.update(userId, { two_fa_secret: secret });

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.2fa_setup_started",
      entity: userId,
      clientId: userId,
      req,
    });

    return { qrCode: qrCodeDataUrl, secret };
  },

  async confirm2FA(userId: string, totpCode: string, req?: Request) {
    const client = await clientModel.findById(userId);
    if (!client.two_fa_secret) throw new Error("2FA not initialized");

    const isValid = authenticator.verify({
      token: totpCode,
      secret: client.two_fa_secret,
    });

    if (!isValid) throw new Error("Invalid TOTP code");

    const before = { two_fa_enabled: client.two_fa_enabled };
    await clientModel.update(userId, { two_fa_enabled: true });

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.2fa_enabled",
      entity: userId,
      clientId: userId,
      before,
      after: { two_fa_enabled: true },
      req,
    });

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

  async forgotPassword(email: string, req?: Request) {
    // Always return success — never reveal whether the email exists.
    const userRows = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRows[0] || !userRows[0].isActive) return { ok: true };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Wipe any existing OTP for this email (registration or previous reset)
    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

    await db.insert(emailVerifications).values({
      id: crypto.randomUUID(),
      email,
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:28px 32px;">
          <h2 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Reset your password</h2>
          <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">VScanMail account security</p>
        </div>
        <div style="padding:28px 32px;background:#fff;">
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
            We received a request to reset the password for your VScanMail account.<br>
            Use the code below — it expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:10px;padding:20px 24px;text-align:center;margin:0 0 24px;">
            <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Your verification code</p>
            <p style="color:#1d4ed8;font-size:38px;font-weight:800;letter-spacing:0.22em;margin:0;font-variant-numeric:tabular-nums;">${otp}</p>
          </div>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;">
            If you didn't request a password reset, you can safely ignore this email — your password will not change.
          </p>
          <div style="padding:14px 16px;background:#fef3c7;border-radius:8px;border-left:3px solid #f59e0b;">
            <p style="color:#92400e;font-size:12px;margin:0;">
              <strong>Security tip:</strong> VScanMail will never ask for your code over the phone or chat.
            </p>
          </div>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">VScanMail · vscanmail.com · This email was sent to ${email}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "VScanMail — Your password reset code",
      html,
    });

    return { ok: true };
  },

  async resetPassword(email: string, otp: string, newPassword: string, req?: Request) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRows[0]) throw new Error("Invalid or expired code.");

    const userId = userRows[0].id;

    const verRows = await db
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

    if (!verRows[0]) throw new Error("Invalid or expired code.");

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash, emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));

    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.password_reset",
      entity: userId,
      clientId: userId,
      req,
    });

    return { ok: true };
  },
};
