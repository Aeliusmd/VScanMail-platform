import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
import { signEmailChangeToken, verifyAccessToken } from "@/lib/modules/auth/jwt";

/** Must wait this long after enabling 2FA before email can be changed. */
const MFA_ENABLE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** After verifying TOTP for email change, user has this long to finish the flow. */
const EMAIL_CHANGE_STEPUP_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const actor = await withAuth(req);

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
      return NextResponse.json({
        status: "2fa_required",
        message: "Enable 2-Factor Authentication before changing your email address.",
      });
    }

    const enabledAt = user.mfaEnabledAt ? new Date(user.mfaEnabledAt as Date).getTime() : 0;
    if (!enabledAt || Date.now() - enabledAt < MFA_ENABLE_COOLDOWN_MS) {
      const availableAt = new Date(enabledAt + MFA_ENABLE_COOLDOWN_MS).toISOString();
      return NextResponse.json({
        status: "cooldown",
        message:
          "Email changes are available 24 hours after enabling 2-Factor Authentication. Please try again later.",
        availableAt,
      });
    }

    const sessionToken = req.cookies.get("sb-access-token")?.value;
    let emailChangeVerifiedAt: number | undefined;
    if (sessionToken) {
      try {
        const decoded = await verifyAccessToken(sessionToken);
        emailChangeVerifiedAt = decoded.emailChangeVerifiedAt;
      } catch {
        emailChangeVerifiedAt = undefined;
      }
    }

    const lastStepUpMs = emailChangeVerifiedAt ? emailChangeVerifiedAt * 1000 : 0;
    const recentlyVerifiedForEmailChange =
      lastStepUpMs > 0 && Date.now() - lastStepUpMs < EMAIL_CHANGE_STEPUP_MS;

    if (recentlyVerifiedForEmailChange) {
      const emailChangeToken = await signEmailChangeToken({ sub: user.id, email: user.email });
      return NextResponse.json({
        status: "ready",
        requiresTotp: false,
        emailChangeToken,
        nextStep: 2,
        stepUpExpiresAt: new Date(lastStepUpMs + EMAIL_CHANGE_STEPUP_MS).toISOString(),
      });
    }

    return NextResponse.json({
      status: "ready",
      requiresTotp: true,
      nextStep: 1,
    });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to start email change" }, { status: 400 });
  }
}
