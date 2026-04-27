import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { bankAccountService } from "@/lib/modules/banking/bank-account.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const { id } = await params;
    const result = await bankAccountService.revealForDeposit({
      actorId: user.id,
      actorRole: user.role as "admin" | "super_admin",
      chequeId: id,
      req,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
