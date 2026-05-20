import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt, ne } from "drizzle-orm";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { verifyEmailChangeToken } from "@/lib/modules/auth/jwt";
import { db } from "@/lib/modules/core/db/mysql";
import { clients, emailVerifications, profiles, users } from "@/lib/modules/core/db/schema";
import { auditService } from "@/lib/modules/audit/audit.service";

const schema = z.object({
  emailChangeToken: z.string().min(1),
  email: z.string().email(),
  otp: z.string().length(6),
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
    const { emailChangeToken, email, otp } = schema.parse(await req.json());
    const decoded = await verifyEmailChangeToken(emailChangeToken);
    if (decoded.sub !== actor.id) {
      return NextResponse.json({ error: "Invalid email change token" }, { status: 401 });
    }

    const newEmail = email.toLowerCase();
    await authService.checkEmailUniqueness(newEmail, undefined, actor.id);
    await assertClientEmailAvailable(newEmail, actor.clientId);

    const verifications = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, newEmail),
          eq(emailVerifications.otp, otp),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verifications.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP code." }, { status: 400 });
    }

    const [before] = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
    if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await db.transaction(async (tx) => {
      await tx.update(users).set({ email: newEmail, updatedAt: new Date() }).where(eq(users.id, actor.id));
      if (actor.clientId) {
        await tx.update(clients).set({ email: newEmail, updatedAt: new Date() }).where(eq(clients.id, actor.clientId));
      }
      await tx.delete(emailVerifications).where(eq(emailVerifications.email, newEmail));
    });

    const roleRows = await db
      .select({ role: profiles.role, clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, actor.id))
      .limit(1);

    await auditService.log({
      actor: actor.id,
      actor_role: (roleRows[0]?.role as any) ?? actor.role,
      action: "profile.email_changed",
      entity: actor.id,
      clientId: roleRows[0]?.clientId ?? actor.clientId,
      before: { email: before.email },
      after: { email: newEmail },
      req,
    });

    return NextResponse.json({ ok: true, email: newEmail });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to change email" }, { status: 400 });
  }
}
