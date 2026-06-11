import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
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
        backupEmail: users.backupEmail,
        backupEmailVerifiedAt: users.backupEmailVerifiedAt,
      })
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);

    const u = userRows[0];
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // `withAuth` already resolved the role from `profiles`; reuse it instead of
    // issuing a second identical query.
    return NextResponse.json({
      user: u,
      role: actor.role,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: error.status === 403 ? "Forbidden" : "Unauthorized" },
        { status: error.status }
      );
    }
    console.error("[GET /api/profile/me]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load profile" },
      { status: 500 }
    );
  }
}

