import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryService } from "@/lib/modules/records/delivery.service";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing" }, { status: 400 });

    const ok = rateLimit(`customer:deliveries:list:${user.id}`, 120, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const result = await deliveryService.listMine({ clientId: user.clientId, limit: 200 });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
