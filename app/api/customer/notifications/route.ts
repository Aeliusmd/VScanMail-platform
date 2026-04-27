import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { auditLogModel } from "@/lib/modules/audit/audit.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const rows = await auditLogModel.listNotificationsForUser(user.id, 20);
    return NextResponse.json({ notifications: rows });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: 400 }
    );
  }
}

