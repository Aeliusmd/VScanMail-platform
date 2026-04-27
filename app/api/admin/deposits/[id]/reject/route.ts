import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { depositService } from "@/lib/modules/records/deposit.service";

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;
    const body = await req.json();
    const input = rejectSchema.parse(body);

    const result = await depositService.adminDecide({
      chequeId: id,
      decision: "rejected",
      actorId: user.id,
      actorRole: user.role as any,
      rejectReason: input.reason,
      req,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

