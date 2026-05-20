import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
import { signEmailChangeToken } from "@/lib/modules/auth/jwt";

const schema = z.object({
  totpCode: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    const { totpCode } = schema.parse(await req.json());

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        totpEnabled: users.totpEnabled,
        mfaEnabledAt: users.mfaEnabledAt,
      })
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.totpEnabled) {
      return NextResponse.json(
        { error: "You must enable Multi-Factor Authentication before changing your email address." },
        { status: 403 }
      );
    }

    const enabledAt = user.mfaEnabledAt ? new Date(user.mfaEnabledAt as any).getTime() : 0;
    if (!enabledAt || Date.now() - enabledAt < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Email changes are available 24 hours after enabling MFA. Please try again later." },
        { status: 403 }
      );
    }

    const valid = await authService.verify2FA(actor.id, totpCode);
    if (!valid) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });

    const emailChangeToken = await signEmailChangeToken({ sub: user.id, email: user.email });
    return NextResponse.json({ emailChangeToken });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to verify authenticator" }, { status: 400 });
  }
}
