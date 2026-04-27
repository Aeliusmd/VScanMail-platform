import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { depositService } from "@/lib/modules/records/deposit.service";

const approveSchema = z.object({
  depositDate: z.string().trim().optional(), // YYYY/MM/DD
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const input = approveSchema.parse(body);

    const result = await depositService.adminDecide({
      chequeId: id,
      decision: "approved",
      actorId: user.id,
      actorRole: user.role as any,
      decisionDate: input.depositDate,
      req,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

