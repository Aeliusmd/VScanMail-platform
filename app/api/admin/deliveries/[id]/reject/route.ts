import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryService } from "@/lib/modules/records/delivery.service";

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);
    if (!rateLimit(`admin:deliveries:reject:${user.id}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json();
    const input = rejectSchema.parse(body);

    const result = await deliveryService.adminReject({
      recordId: id,
      actorId: user.id,
      actorRole: user.role as any,
      reason: input.reason,
      req,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
