import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { db } from "@/lib/modules/core/db/mysql";
import { profiles, users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "@/lib/modules/audit/audit.service";

const profileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  backupEmail: z.string().email().optional().nullable(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  language: z.string().min(2).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    const body = await req.json().catch(() => ({}));
    const input = profileSchema.parse(body);

    const beforeRows = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
    const before = beforeRows[0] ?? null;
    if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const emailChanged = input.email.toLowerCase() !== before.email.toLowerCase();
    if (emailChanged) {
      return NextResponse.json(
        { error: "Please verify your authenticator and new email address before changing your email." },
        { status: 403 }
      );
    }

    // Validate email uniqueness (primary + backup)
    await authService.checkEmailUniqueness(input.email, input.backupEmail, actor.id);

    const roleRows = await db
      .select({ role: profiles.role, clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, actor.id))
      .limit(1);

    const backupEmail = input.backupEmail === undefined ? before.backupEmail : input.backupEmail || null;
    const backupEmailChanged = backupEmail !== before.backupEmail;
    const backupEmailVerifiedAt = backupEmailChanged ? null : before.backupEmailVerifiedAt;

    await db
      .update(users)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        backupEmail,
        backupEmailVerifiedAt,
        phone: input.phone,
        bio: input.bio,
        language: input.language,
        updatedAt: new Date(),
      })
      .where(eq(users.id, actor.id));

    await auditService.log({
      actor: actor.id,
      actor_role: (roleRows[0]?.role as any) ?? actor.role,
      action: "profile.updated",
      entity: actor.id,
      clientId: roleRows[0]?.clientId ?? undefined,
      before,
      after: input,
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 400 });
  }
}

