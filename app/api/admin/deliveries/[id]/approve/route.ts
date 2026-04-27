import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryService } from "@/lib/modules/records/delivery.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);
    if (!rateLimit(`admin:deliveries:approve:${user.id}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { id } = await params;
    const result = await deliveryService.adminApprove({
      recordId: id,
      actorId: user.id,
      actorRole: user.role as any,
      req,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
