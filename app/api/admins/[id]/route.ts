// app/api/admins/[id]/route.ts
// PATCH  — update an admin (status, phone, fullName)
// DELETE — deactivate/remove an admin
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const META_DIR = path.join(process.cwd(), ".data");
const META_FILE = path.join(META_DIR, "admin_meta.json");

const updateAdminSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

async function getAllMeta(): Promise<Record<string, any>> {
  try {
    if (!existsSync(META_FILE)) return {};
    const raw = await readFile(META_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeMeta(all: Record<string, any>) {
  if (!existsSync(META_DIR)) await mkdir(META_DIR, { recursive: true });
  await writeFile(META_FILE, JSON.stringify(all, null, 2), "utf-8");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await withAuth(req);
    withRole(actor, ["super_admin"]);

    const { id } = await params;
    const body = await req.json();
    const data = updateAdminSchema.parse(body);

    // Update isActive in users table
    if (data.status !== undefined) {
      await db
        .update(users)
        .set({ isActive: data.status === "Active", updatedAt: new Date() })
        .where(eq(users.id, id));
    }

    // Update metadata
    if (data.fullName !== undefined || data.phone !== undefined) {
      const all = await getAllMeta();
      all[id] = {
        ...all[id],
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      };
      await writeMeta(all);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await withAuth(req);
    withRole(actor, ["super_admin"]);

    const { id } = await params;

    // Prevent self-deletion
    if (actor.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    // Delete profile first (FK constraint), then user
    await db.delete(profiles).where(eq(profiles.userId, id));
    await db.delete(users).where(eq(users.id, id));

    // Clean up metadata
    const all = await getAllMeta();
    delete all[id];
    await writeMeta(all);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
