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
import { auditService } from "@/lib/modules/audit/audit.service";

const updateAdminSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

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

    // Capture before state
    const [current] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!current) throw new Error("Admin not found");
    
    const beforeState = { 
      fullName: current.fullName, 
      phone: current.phone,
      status: current.isActive ? "Active" : "Inactive" 
    };

    // Prepare update object
    const patch: any = { updatedAt: new Date() };
    if (data.status !== undefined) patch.isActive = data.status === "Active";
    if (data.fullName !== undefined) patch.fullName = data.fullName;
    if (data.phone !== undefined) patch.phone = data.phone;

    // Execute update in database
    await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id));

    // Log the action
    await auditService.log({
      actor: actor.id,
      actor_role: actor.role,
      action: "admin.updated",
      entity: id,
      before: beforeState,
      after: { ...data },
      req,
    });

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

    // Capture details before deletion
    const [current] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const beforeState = current ? { email: current.email, status: current.isActive ? "Active" : "Inactive" } : null;

    // Delete profile first (FK constraint), then user
    await db.delete(profiles).where(eq(profiles.userId, id));
    await db.delete(users).where(eq(users.id, id));

    // Log the action
    await auditService.log({
      actor: actor.id,
      actor_role: actor.role,
      action: "admin.deleted",
      entity: id,
      before: beforeState,
      req,
    });


    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
