import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { deliveryService } from "@/lib/modules/records/delivery.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;
    const result = await deliveryService.adminCancel({
      recordId: id,
      actorId: user.id,
      actorRole: user.role as "admin" | "super_admin",
      req,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
