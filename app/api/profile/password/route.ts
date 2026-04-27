import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { profiles, users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "@/lib/modules/audit/audit.service";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    const body = await req.json().catch(() => ({}));
    const input = passwordSchema.parse(body);

    const userRows = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
    const u = userRows[0];
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ok = await bcrypt.compare(input.currentPassword, u.passwordHash);
    if (!ok) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

    const newHash = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, actor.id));

    const roleRows = await db
      .select({ role: profiles.role, clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, actor.id))
      .limit(1);

    await auditService.log({
      actor: actor.id,
      actor_role: (roleRows[0]?.role as any) ?? actor.role,
      action: "profile.password_updated",
      entity: actor.id,
      clientId: roleRows[0]?.clientId ?? undefined,
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 400 });
  }
}

