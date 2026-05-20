import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { verifyEmailChangeToken } from "@/lib/modules/auth/jwt";
import { db } from "@/lib/modules/core/db/mysql";
import { clients, emailVerifications } from "@/lib/modules/core/db/schema";
import { sendEmail } from "@/lib/modules/notifications/email.client";

const schema = z.object({
  emailChangeToken: z.string().min(1),
  email: z.string().email(),
});

async function assertClientEmailAvailable(email: string, clientId?: string) {
  if (!clientId) return;
  const rows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.email, email), ne(clients.id, clientId)))
    .limit(1);
  if (rows.length > 0) throw new Error(`Email ${email} is already in use.`);
}

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    const { emailChangeToken, email } = schema.parse(await req.json());
    const decoded = await verifyEmailChangeToken(emailChangeToken);
    if (decoded.sub !== actor.id) {
      return NextResponse.json({ error: "Invalid email change token" }, { status: 401 });
    }

    const newEmail = email.toLowerCase();
    await authService.checkEmailUniqueness(newEmail, undefined, actor.id);
    await assertClientEmailAvailable(newEmail, actor.clientId);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.delete(emailVerifications).where(eq(emailVerifications.email, newEmail));
    await db.insert(emailVerifications).values({
      id: crypto.randomUUID(),
      email: newEmail,
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
    });

    await sendEmail({
      to: newEmail,
      subject: "VScanMail - Verify your new email address",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:20px auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
          <h2 style="color:#1d4ed8;margin-top:0;">Verify your new email address</h2>
          <p>Use the verification code below to confirm this email for your VScanMail account.</p>
          <div style="background:#f1f5f9;font-size:32px;font-weight:bold;letter-spacing:4px;padding:12px;text-align:center;border-radius:4px;margin:20px 0;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:12px;">This code is valid for 15 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to send verification code" }, { status: 400 });
  }
}
