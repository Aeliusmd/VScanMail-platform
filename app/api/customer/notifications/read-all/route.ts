import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { auditLogModel } from "@/lib/modules/audit/audit.model";

export async function PATCH(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    await auditLogModel.markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: error.status === 403 ? "Forbidden" : "Unauthorized" },
        { status: error.status }
      );
    }
    console.error("[customer/notifications/read-all PATCH]", error?.message || error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}

