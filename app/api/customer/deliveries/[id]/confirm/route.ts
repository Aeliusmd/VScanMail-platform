import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { deliveryService } from "@/lib/modules/records/delivery.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing" }, { status: 400 });

    const { id } = await params;
    await deliveryService.confirmReceived({ recordId: id, clientId: user.clientId, actorId: user.id, req });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: error.status === 403 ? "Forbidden" : "Unauthorized" },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to confirm receipt";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
