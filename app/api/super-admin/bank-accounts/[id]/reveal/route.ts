import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { revealBankAccountSchema } from "@/lib/modules/banking/bank-account.schema";
import { bankAccountService } from "@/lib/modules/banking/bank-account.service";
import { db } from "@/lib/modules/core/db/mysql";
import { profiles } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { authenticator } from "otplib";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin"]);

    const ok = rateLimit(`super-admin:bank-accounts:reveal:${user.id}`, 30, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const { totpCode, reason } = revealBankAccountSchema.parse(body);

    const profileRows = await db
      .select({ twoFaSecret: profiles.twoFaSecret })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    const twoFaSecret = profileRows[0]?.twoFaSecret;
    if (!twoFaSecret) {
      return NextResponse.json(
        { error: "Super admin MFA not enrolled", code: "MFA_NOT_ENROLLED" },
        { status: 412 }
      );
    }

    const totpOk = authenticator.verify({ token: totpCode, secret: twoFaSecret });
    if (!totpOk) {
      return NextResponse.json({ error: "Invalid TOTP code" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const revealed = await bankAccountService.revealForSuperAdmin({
      actorId: user.id,
      actorRole: "super_admin",
      bankAccountId: id,
      reason,
      req,
    });

    const res = NextResponse.json({ bankAccount: revealed });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[API/SuperAdmin/BankAccounts/Reveal] Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to reveal bank account" },
      { status: 400 }
    );
  }
}

