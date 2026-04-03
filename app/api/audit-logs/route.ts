import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { auditLogs, users } from "@/lib/modules/core/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/audit-logs
 * Fetch system-wide activity logs.
 * Restricted to Super Admins and Admins.
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize
    const actor = await withAuth(req).catch((err) => {
        if (err instanceof Response) throw err;
        throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    });
    
    // Only super_admin or admin can view system logs
    withRole(actor, ["super_admin", "admin"]);

    // Fetch latest 100 logs with actor email
    const logs = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200); // Fetch a decent amount of recent records

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error("[API_AUDIT_LOGS_GET]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
