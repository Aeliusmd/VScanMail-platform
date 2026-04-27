import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { auditLogModel } from "@/lib/modules/audit/audit.model";

export async function PATCH(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    await auditLogModel.markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to mark all notifications as read" }, { status: 400 });
  }
}

