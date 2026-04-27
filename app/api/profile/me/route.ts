import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { profiles, users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const actor = await withAuth(req);

    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);

    const profileRows = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.userId, actor.id))
      .limit(1);

    const u = userRows[0];
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      user: u,
      role: (profileRows[0]?.role as any) ?? actor.role,
    });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json(
      { error: error.message || "Failed to load profile" },
      { status: 400 }
    );
  }
}

