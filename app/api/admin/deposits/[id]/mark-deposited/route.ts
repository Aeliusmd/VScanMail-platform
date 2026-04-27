import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { depositService } from "@/lib/modules/records/deposit.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;

    const result = await depositService.adminMarkDeposited({
      chequeId: id,
      actorId: user.id,
      actorRole: user.role as any,
      req,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

