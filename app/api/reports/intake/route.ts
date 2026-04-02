// ---- app/api/reports/intake/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    // Dashboard cards are shown for both admin and client roles.
    withRole(user, ["admin", "client"]);

    const fromDate = req.nextUrl.searchParams.get("from");
    const toDate = req.nextUrl.searchParams.get("to");
    const clientId = user.role === "admin" ? null : user.clientId!;

    let targetClients = [];
    if (clientId) {
      const dbClient = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (dbClient[0]) targetClients.push(dbClient[0]);
    } else {
      targetClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    }

    let allRecords: any[] = [];
    if (targetClients.length > 0) {
      const queries = targetClients.map(c => {
        let q = `SELECT record_type as type, mail_status as status, cheque_decision, scanned_at FROM \`${c.tableName}\``;
        const conds = [];
        if (fromDate) conds.push(`scanned_at >= '${fromDate}'`);
        if (toDate) conds.push(`scanned_at <= '${toDate}'`);
        if (conds.length > 0) {
          q += ` WHERE ` + conds.join(' AND ');
        }
        return sql.raw(q);
      });
      const unionQuery = sql.join(queries, sql` UNION ALL `);
      const [rows] = await db.execute(unionQuery) as any;
      allRecords = rows;
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let pendingRequests = 0;

    for (const item of allRecords) {
      const typeStr = item.type as string;
      const statusStr = item.status as string;
      byType[typeStr] = (byType[typeStr] || 0) + 1;
      byStatus[statusStr] = (byStatus[statusStr] || 0) + 1;

      if (typeStr === 'cheque' && item.cheque_decision === 'pending') {
        pendingRequests++;
      }
    }

    const totalCheques = byType["cheque"] || 0;
    const totalMails =
      (byType["letter"] || 0) + (byType["package"] || 0) + (byType["legal"] || 0);

    // Active companies.
    let activeCompanies = 0;
    const count = allRecords.length;
    if (user.role === "admin") {
      const res = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "active"));
      activeCompanies = Number(res[0]?.count || 0);
    } else {
      const me = await db
        .select({ status: clients.status })
        .from(clients)
        .where(eq(clients.id, clientId!))
        .limit(1);
      activeCompanies = me[0]?.status === "active" ? 1 : 0;
    }

    return NextResponse.json({
      total: count,
      byType,
      byStatus,
      totalMails,
      totalCheques,
      activeCompanies,
      pendingRequests,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
