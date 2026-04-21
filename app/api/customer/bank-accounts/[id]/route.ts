import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { bankAccountService } from "@/lib/modules/banking/bank-account.service";
import { deleteBankAccountSchema } from "@/lib/modules/banking/bank-account.schema";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) {
      return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });
    }

    const ok = rateLimit(`customer:bank-accounts:delete:${user.id}`, 20, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const { password } = deleteBankAccountSchema.parse(body);

    const userRows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!userRows[0]) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const passOk = await bcrypt.compare(password, userRows[0].passwordHash);
    // Important: don't return 401 here. The frontend treats 401 as "session invalid" and forces logout.
    // Wrong password is a validation failure, not an authentication failure.
    if (!passOk) return NextResponse.json({ error: "Invalid password" }, { status: 400 });

    const { id } = await ctx.params;
    await bankAccountService.deleteForClient({
      actorId: user.id,
      actorRole: user.role as any,
      clientId: user.clientId,
      bankAccountId: id,
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[API/Customer/BankAccounts] DELETE Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to delete bank account" }, { status: 400 });
  }
}

