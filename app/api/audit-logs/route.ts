import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { auditLogs, users, clients } from "@/lib/modules/core/db/schema";
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

    // Fetch latest logs with all meta-data
    const rows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        clientId: auditLogs.clientId,
        beforeState: auditLogs.beforeState,
        afterState: auditLogs.afterState,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        actorFirstName: users.firstName,
        actorLastName: users.lastName,
        companyName: clients.companyName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      // Join clients on clientId (new logs) or actorId (legacy client logs)
      .leftJoin(clients, eq(auditLogs.clientId, clients.id)) 
      .orderBy(desc(auditLogs.createdAt))
      .limit(500); 

    const logs = rows.map(r => ({
      ...r,
      actorName: r.actorFirstName && r.actorLastName 
        ? `${r.actorFirstName} ${r.actorLastName}`
        : (r.actorFirstName || r.actorLastName || null)
    }));

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
