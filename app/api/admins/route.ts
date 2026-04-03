// app/api/admins/route.ts
// GET  — list all admin users (role = 'admin')
// POST — create a new admin user account
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { desc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auditService } from "@/lib/modules/audit/audit.service";

const createAdminSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  password: z.string().min(8, "Password must be at least 8 characters"),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updateAdminSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

/** Map DB rows (users + profiles join) to a clean frontend shape */
function toFrontendAdmin(row: any, index: number) {
  const avatarColors = [
    "from-[#0A3D8F] to-[#083170]",
    "from-red-500 to-red-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-amber-600",
    "from-violet-500 to-violet-700",
    "from-cyan-500 to-cyan-700",
  ];
  const name = row.fullName || row.email.split("@")[0];
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: row.id,
    name,
    email: row.email,
    phone: row.phone || "",
    role: "Admin",
    status: row.isActive ? "Active" : "Inactive",
    joined: row.createdAt
      ? new Date(row.createdAt).toISOString().split("T")[0]
      : "",
    lastLogin: row.lastLoginAt
      ? new Date(row.lastLoginAt).toISOString()
      : null,
    initials,
    avatarColor: avatarColors[index % avatarColors.length],
  };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    withRole(actor, ["super_admin"]);

    // Join users + profiles, filter by role = 'admin'
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
        fullName: users.fullName,
        phone: users.phone,
        lastLoginAt: users.lastLoginAt,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.role, "admin"))
      .orderBy(desc(users.createdAt));

    const admins = rows.map((row, i) => {
      return toFrontendAdmin(row, i);
    });

    return NextResponse.json({ admins, total: admins.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    withRole(actor, ["super_admin"]);

    const body = await req.json();
    const data = createAdminSchema.parse(body);

    // Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        isActive: data.status === "active",
        emailVerifiedAt: new Date(), // Admin accounts are pre-verified
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(profiles).values({
        id: profileId,
        userId,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    const admin = toFrontendAdmin(
      {
        id: userId,
        email: data.email,
        isActive: data.status === "active",
        createdAt: new Date(),
        fullName: data.fullName,
        phone: data.phone,
      },
      0
    );
    
    // Log the action
    await auditService.log({
      actor: actor.id,
      actor_role: actor.role,
      action: "admin.created",
      entity: userId,
      after: { email: data.email, fullName: data.fullName, status: data.status },
      req,
    });


    return NextResponse.json({ admin }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
