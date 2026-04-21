import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { bankAccountService } from "@/lib/modules/banking/bank-account.service";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) {
      return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });
    }

    const ok = rateLimit(`customer:bank-accounts:primary:${user.id}`, 60, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { id } = await ctx.params;
    await bankAccountService.setPrimary({
      actorId: user.id,
      actorRole: user.role as any,
      clientId: user.clientId,
      bankAccountId: id,
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[API/Customer/BankAccounts/Primary] PATCH Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to set primary" }, { status: 400 });
  }
}

