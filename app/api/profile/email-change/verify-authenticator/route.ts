import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
import { signAccessToken, signEmailChangeToken, verifyAccessToken } from "@/lib/modules/auth/jwt";

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
        { error: "You must enable 2-Factor Authentication before changing your email address." },
        { status: 403 }
      );
    }

    const enabledAt = user.mfaEnabledAt ? new Date(user.mfaEnabledAt as Date).getTime() : 0;
    const MFA_ENABLE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
    if (!enabledAt || Date.now() - enabledAt < MFA_ENABLE_COOLDOWN_MS) {
      return NextResponse.json(
        {
          error:
            "Email changes are available 24 hours after enabling 2-Factor Authentication. Please try again later.",
        },
        { status: 403 }
      );
    }

    const valid = await authService.verify2FA(actor.id, totpCode);
    if (!valid) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });

    const emailChangeToken = await signEmailChangeToken({ sub: user.id, email: user.email });
    const now = Math.floor(Date.now() / 1000);

    let existingMfaVerifiedAt: number | undefined;
    const sessionToken = req.cookies.get("sb-access-token")?.value;
    if (sessionToken) {
      try {
        const decoded = await verifyAccessToken(sessionToken);
        existingMfaVerifiedAt = decoded.mfaVerifiedAt;
      } catch {
        existingMfaVerifiedAt = undefined;
      }
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      mfaVerifiedAt: existingMfaVerifiedAt,
      emailChangeVerifiedAt: now,
    });

    const res = NextResponse.json({
      emailChangeToken,
      stepUpExpiresAt: new Date(now * 1000 + 5 * 60 * 1000).toISOString(),
    });
    res.cookies.set("sb-access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
    return res;
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to verify authenticator" }, { status: 400 });
  }
}
