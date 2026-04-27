import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { profiles, users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auditService } from "@/lib/modules/audit/audit.service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name || "avatar.jpg") || ".jpg";
    const filename = `${actor.id}-${Date.now()}${ext}`;
    const fullPath = path.join(uploadDir, filename);
    const relativeUrl = `/uploads/avatars/${filename}`;

    await writeFile(fullPath, buffer);

    const roleRows = await db
      .select({ role: profiles.role, clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, actor.id))
      .limit(1);

    await db.update(users).set({ avatarUrl: relativeUrl, updatedAt: new Date() }).where(eq(users.id, actor.id));

    await auditService.log({
      actor: actor.id,
      actor_role: (roleRows[0]?.role as any) ?? actor.role,
      action: "profile.avatar_updated",
      entity: actor.id,
      clientId: roleRows[0]?.clientId ?? undefined,
      after: { avatarUrl: relativeUrl },
      req,
    });

    return NextResponse.json({ ok: true, url: relativeUrl });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to upload avatar" }, { status: 400 });
  }
}

