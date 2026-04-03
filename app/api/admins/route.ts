// app/api/admins/route.ts
// GET  — list all admin users (role = 'admin')
// POST — create a new admin user account
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
        // We'll get the fullName from a metadata column that doesn't exist yet,
        // so we fall back to email prefix. Phone doesn't exist on users table either.
        // For now surface what we have; the frontend will handle display.
        fullName: users.email, // placeholder — will be overridden with metadata join later
        phone: users.email,    // placeholder
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.role, "admin"))
      .orderBy(desc(users.createdAt));

    // The schema doesn't have a separate admin_profiles / metadata table yet.
    // We'll store fullName in a separate lightweight lookup after creation.
    // For now, retrieve from admin_meta if it exists.
    const adminMeta = await getAdminMeta(rows.map((r) => r.id));

    const admins = rows.map((row, i) => {
      const meta = adminMeta[row.id] || {};
      return toFrontendAdmin(
        {
          id: row.id,
          email: row.email,
          isActive: row.isActive,
          createdAt: row.createdAt,
          fullName: meta.fullName || null,
          phone: meta.phone || "",
        },
        i
      );
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

    // Store extended metadata (fullName, phone)
    await setAdminMeta(userId, { fullName: data.fullName, phone: data.phone });

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

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// Light-weight admin metadata stored in JSON file (no schema migration needed)
// In production this would be a proper admin_profiles table.
// ---------------------------------------------------------------------------
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const META_DIR = path.join(process.cwd(), ".data");
const META_FILE = path.join(META_DIR, "admin_meta.json");

async function getAdminMeta(ids: string[]): Promise<Record<string, { fullName?: string; phone?: string }>> {
  try {
    if (!existsSync(META_FILE)) return {};
    const raw = await readFile(META_FILE, "utf-8");
    const all = JSON.parse(raw) as Record<string, { fullName?: string; phone?: string }>;
    const result: Record<string, { fullName?: string; phone?: string }> = {};
    for (const id of ids) result[id] = all[id] || {};
    return result;
  } catch {
    return {};
  }
}

async function setAdminMeta(id: string, meta: { fullName?: string; phone?: string }) {
  try {
    if (!existsSync(META_DIR)) await mkdir(META_DIR, { recursive: true });
    let all: Record<string, any> = {};
    if (existsSync(META_FILE)) {
      const raw = await readFile(META_FILE, "utf-8");
      all = JSON.parse(raw);
    }
    all[id] = { ...all[id], ...meta };
    await writeFile(META_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write admin meta:", e);
  }
}
