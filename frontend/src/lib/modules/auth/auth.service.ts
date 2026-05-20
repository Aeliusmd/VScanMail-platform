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
import { emailVerifications, profiles, users, clients, recoveryCodes } from "@/lib/modules/core/db/schema";
import { and, eq, ne, gt, sql } from "drizzle-orm";
import { createClientTable } from "@/lib/modules/core/db/dynamic-table";

export const authService = {
  async register(input: RegisterInput, req?: Request) {
    await authService.checkEmailUniqueness(input.email);
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
    await db.update(users).set({ totpSecret: secret, updatedAt: new Date() }).where(eq(users.id, userId));

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

  async checkEmailUniqueness(primaryEmail: string, backupEmail?: string | null, excludeUserId?: string) {
    const pConflict = await db
      .select({ id: users.id })
      .from(users)
      .where(
        excludeUserId
          ? and(eq(users.email, primaryEmail), ne(users.id, excludeUserId))
          : eq(users.email, primaryEmail)
      )
      .limit(1);
    if (pConflict.length > 0) {
      throw new Error(`Email ${primaryEmail} is already in use as a primary email.`);
    }

    const pAsBConflict = await db
      .select({ id: users.id })
      .from(users)
      .where(
        excludeUserId
          ? and(eq(users.backupEmail, primaryEmail), ne(users.id, excludeUserId))
          : eq(users.backupEmail, primaryEmail)
      )
      .limit(1);
    if (pAsBConflict.length > 0) {
      throw new Error(`Email ${primaryEmail} is already in use as a backup email.`);
    }

    if (backupEmail) {
      if (primaryEmail.toLowerCase() === backupEmail.toLowerCase()) {
        throw new Error("Backup email must be different from primary email.");
      }

      const bAsPConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(
          excludeUserId
            ? and(eq(users.email, backupEmail), ne(users.id, excludeUserId))
            : eq(users.email, backupEmail)
        )
        .limit(1);
      if (bAsPConflict.length > 0) {
        throw new Error(`Backup email ${backupEmail} is already in use as a primary email.`);
      }

      const bConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(
          excludeUserId
            ? and(eq(users.backupEmail, backupEmail), ne(users.id, excludeUserId))
            : eq(users.backupEmail, backupEmail)
        )
        .limit(1);
      if (bConflict.length > 0) {
        throw new Error(`Backup email ${backupEmail} is already in use as a backup email.`);
      }
    }
  },

  async confirm2FA(userId: string, totpCode: string, req?: Request) {
    const userRows = await db
      .select({ totpSecret: users.totpSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];
    if (!user?.totpSecret) throw new Error("2FA not initialized");

    const isValid = authenticator.verify({
      token: totpCode,
      secret: user.totpSecret,
    });

    if (!isValid) throw new Error("Invalid TOTP code");

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.2fa_setup_confirmed",
      entity: userId,
      clientId: userId,
      req,
    });

    return { verified: true };
  },

  async generateAndStoreRecoveryCodes(userId: string): Promise<string[]> {
    const rawCodes: string[] = [];
    const hashedCodesData: { id: string; userId: string; codeHash: string; createdAt: Date }[] = [];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < 8; i++) {
      let part1 = "";
      let part2 = "";
      let part3 = "";
      for (let j = 0; j < 4; j++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
        part3 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const rawCode = `${part1}-${part2}-${part3}`;
      rawCodes.push(rawCode);
      const codeHash = await bcrypt.hash(rawCode, 10);
      hashedCodesData.push({
        id: crypto.randomUUID(),
        userId,
        codeHash,
        createdAt: new Date(),
      });
    }

    // Wipe any existing recovery codes for this user
    await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));

    // Insert newly generated codes
    for (const codeData of hashedCodesData) {
      await db.insert(recoveryCodes).values(codeData);
    }

    return rawCodes;
  },

  async sendBackupEmailOTP(userId: string, backupEmail: string, req?: Request) {
    const userRows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];
    if (!user) throw new Error("User not found");

    // Enforce email uniqueness
    await authService.checkEmailUniqueness(user.email, backupEmail, userId);

    // Save backup email temporarily (unverified)
    await db
      .update(users)
      .set({ backupEmail, backupEmailVerifiedAt: null })
      .where(eq(users.id, userId));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Wipe existing OTPs for this backup email
    await db.delete(emailVerifications).where(eq(emailVerifications.email, backupEmail));

    // Insert OTP record
    await db.insert(emailVerifications).values({
      id: crypto.randomUUID(),
      email: backupEmail,
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    // Send email
    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:20px auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
        <h2 style="color:#1d4ed8;margin-top:0;">Verify your Backup Email</h2>
        <p>You requested to set this address as your VScanMail account recovery backup email.</p>
        <p>Use the verification code below to complete the setup. This code is valid for 15 minutes.</p>
        <div style="background:#f1f5f9;font-size:32px;font-weight:bold;letter-spacing:4px;padding:12px;text-align:center;border-radius:4px;margin:20px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:12px;">If you did not initiate this request, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: backupEmail,
      subject: "VScanMail — Verify your recovery backup email",
      html,
    });

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.backup_email_verification_started",
      entity: userId,
      clientId: userId,
      after: { backupEmail },
      req,
    });

    return { success: true };
  },

  async verifyBackupEmailOTP(userId: string, otp: string, req?: Request) {
    const userRows = await db
      .select({ backupEmail: users.backupEmail })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];
    if (!user || !user.backupEmail) throw new Error("Backup email not set");

    const verifications = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, user.backupEmail),
          eq(emailVerifications.otp, otp),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verifications.length === 0) {
      throw new Error("Invalid or expired OTP code.");
    }

    // Mark verified
    await db
      .update(users)
      .set({ backupEmailVerifiedAt: new Date() })
      .where(eq(users.id, userId));

    // Delete OTP
    await db.delete(emailVerifications).where(eq(emailVerifications.email, user.backupEmail));

    // Generate recovery codes
    const recoveryPlaintextCodes = await authService.generateAndStoreRecoveryCodes(userId);

    // Finalize 2FA setup
    await db
      .update(users)
      .set({ totpEnabled: true, mfaEnabledAt: sql`NOW()` as any, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.backup_email_verified",
      entity: userId,
      clientId: userId,
      after: { backupEmail: user.backupEmail },
      req,
    });

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.2fa_enabled",
      entity: userId,
      clientId: userId,
      after: { totp_enabled: true },
      req,
    });

    return { success: true, codes: recoveryPlaintextCodes };
  },

  async skipBackupEmail(userId: string, req?: Request) {
    // Clear backup email if any was in progress
    await db
      .update(users)
      .set({ backupEmail: null, backupEmailVerifiedAt: null })
      .where(eq(users.id, userId));

    // Generate recovery codes
    const recoveryPlaintextCodes = await authService.generateAndStoreRecoveryCodes(userId);

    // Finalize 2FA setup
    await db
      .update(users)
      .set({ totpEnabled: true, mfaEnabledAt: sql`NOW()` as any, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.backup_email_skipped",
      entity: userId,
      clientId: userId,
      req,
    });

    await auditService.log({
      actor: userId,
      actor_role: "client",
      action: "auth.2fa_enabled",
      entity: userId,
      clientId: userId,
      after: { totp_enabled: true },
      req,
    });

    return { success: true, codes: recoveryPlaintextCodes };
  },

  async sendRecoveryEmailOTP(primaryEmail: string, req?: Request) {
    const userRows = await db
      .select({ id: users.id, backupEmail: users.backupEmail, backupEmailVerifiedAt: users.backupEmailVerifiedAt })
      .from(users)
      .where(eq(users.email, primaryEmail))
      .limit(1);
    const user = userRows[0];
    if (!user) throw new Error("Account not found.");
    if (!user.backupEmail || !user.backupEmailVerifiedAt) {
      throw new Error("Backup email recovery is not configured for this account.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Wipe existing OTPs for this backup email
    await db.delete(emailVerifications).where(eq(emailVerifications.email, user.backupEmail));

    // Insert OTP record
    await db.insert(emailVerifications).values({
      id: crypto.randomUUID(),
      email: user.backupEmail,
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    // Send email
    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:20px auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
        <h2 style="color:#1d4ed8;margin-top:0;">Account Recovery Verification Code</h2>
        <p>You requested to recover access to your VScanMail account using this backup email.</p>
        <p>Use the recovery code below to disable 2FA and log in. This code is valid for 15 minutes.</p>
        <div style="background:#eff6ff;border:2px dashed #93c5fd;color:#1d4ed8;font-size:32px;font-weight:bold;letter-spacing:4px;padding:12px;text-align:center;border-radius:4px;margin:20px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:12px;">If you did not initiate this request, please contact support immediately.</p>
      </div>
    `;

    await sendEmail({
      to: user.backupEmail,
      subject: "VScanMail — Account recovery verification code",
      html,
    });

    await auditService.log({
      actor: user.id,
      actor_role: "client",
      action: "auth.recovery_otp_sent",
      entity: user.id,
      clientId: user.id,
      req,
    });

    return { success: true };
  },

  async recoverAccountWithBackupEmail(primaryEmail: string, otp: string, req?: Request) {
    const userRows = await db
      .select({ id: users.id, backupEmail: users.backupEmail, backupEmailVerifiedAt: users.backupEmailVerifiedAt })
      .from(users)
      .where(eq(users.email, primaryEmail))
      .limit(1);
    const user = userRows[0];
    if (!user) throw new Error("Account not found.");
    if (!user.backupEmail || !user.backupEmailVerifiedAt) {
      throw new Error("Backup email recovery is not configured for this account.");
    }

    const verifications = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, user.backupEmail),
          eq(emailVerifications.otp, otp),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verifications.length === 0) {
      throw new Error("Invalid or expired OTP code.");
    }

    // Reset 2FA
    await db
      .update(users)
      .set({ totpEnabled: false, totpSecret: null, mfaEnabledAt: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Clean up OTP and existing recovery codes
    await db.delete(emailVerifications).where(eq(emailVerifications.email, user.backupEmail));
    await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, user.id));

    // Log audit
    await auditService.log({
      actor: user.id,
      actor_role: "client",
      action: "auth.recovery_used_backup_email",
      entity: user.id,
      clientId: user.id,
      req,
    });

    // Send security alert to primary email
    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:20px auto;border:1px solid #fecaca;border-radius:8px;padding:24px;border-top:4px solid #ef4444;">
        <h2 style="color:#ef4444;margin-top:0;">Security Alert: 2FA Disabled</h2>
        <p>Hello,</p>
        <p>This is an automated notification that **Two-Factor Authentication (2FA)** has been disabled on your VScanMail account using your **Backup Recovery Email**.</p>
        <p>You can now log in using only your password. Please log in immediately and reconfigure 2FA to keep your account secure.</p>
        <div style="background:#fef2f2;padding:12px;border-radius:4px;color:#991b1b;margin:20px 0;font-size:13px;">
          <strong>If you did not initiate this recovery:</strong> please contact support immediately to lock your account.
        </div>
      </div>
    `;

    await sendEmail({
      to: primaryEmail,
      subject: "VScanMail Security Alert — 2FA Disabled",
      html,
    });

    return { success: true };
  },

  async recoverAccountWithRecoveryCode(primaryEmail: string, code: string, req?: Request) {
    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, primaryEmail))
      .limit(1);
    const user = userRows[0];
    if (!user) throw new Error("Account not found.");

    const codes = await db
      .select()
      .from(recoveryCodes)
      .where(and(eq(recoveryCodes.userId, user.id), eq(recoveryCodes.used, false)));

    let matchedCode: any = null;
    for (const activeCode of codes) {
      const match = await bcrypt.compare(code, activeCode.codeHash);
      if (match) {
        matchedCode = activeCode;
        break;
      }
    }

    if (!matchedCode) {
      throw new Error("Invalid or already used recovery code.");
    }

    // Mark recovery code as used
    await db
      .update(recoveryCodes)
      .set({ used: true, usedAt: new Date() })
      .where(eq(recoveryCodes.id, matchedCode.id));

    // Reset 2FA
    await db
      .update(users)
      .set({ totpEnabled: false, totpSecret: null, mfaEnabledAt: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Wipe other recovery codes (forcing regeneration next time they set up 2FA)
    await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, user.id));

    // Log audit
    await auditService.log({
      actor: user.id,
      actor_role: "client",
      action: "auth.recovery_used_recovery_code",
      entity: user.id,
      clientId: user.id,
      req,
    });

    // Send security alert to primary email
    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:20px auto;border:1px solid #fecaca;border-radius:8px;padding:24px;border-top:4px solid #ef4444;">
        <h2 style="color:#ef4444;margin-top:0;">Security Alert: 2FA Disabled</h2>
        <p>Hello,</p>
        <p>This is an automated notification that **Two-Factor Authentication (2FA)** has been disabled on your VScanMail account using a **Recovery Code**.</p>
        <p>You can now log in using only your password. Please log in immediately and reconfigure 2FA to keep your account secure.</p>
        <div style="background:#fef2f2;padding:12px;border-radius:4px;color:#991b1b;margin:20px 0;font-size:13px;">
          <strong>If you did not initiate this recovery:</strong> please contact support immediately to lock your account.
        </div>
      </div>
    `;

    await sendEmail({
      to: primaryEmail,
      subject: "VScanMail Security Alert — 2FA Disabled",
      html,
    });

    return { success: true };
  },

  async verify2FA(userId: string, totpCode: string) {
    const userRows = await db
      .select({ totpEnabled: users.totpEnabled, totpSecret: users.totpSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];
    if (!user?.totpEnabled || !user.totpSecret) return true;

    return authenticator.verify({
      token: totpCode,
      secret: user.totpSecret,
    });
  },

  async forgotPassword(email: string, req?: Request) {
    const userRows = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRows[0] || !userRows[0].isActive) {
      throw new Error("No account exists for this email address. Please enter the email address registered in our system.");
    }

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
