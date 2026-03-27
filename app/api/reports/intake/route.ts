// ---- app/api/reports/intake/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { db, sql } from "@/lib/db/mysql";
import { mailItems, clients, cheques } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    // Dashboard cards are shown for both admin and client roles.
    withRole(user, ["admin", "client"]);

    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const clientId = user.role === "admin" ? null : user.clientId!;

    // Mail aggregates.
    const mailConditions = [];
    if (from) mailConditions.push(sql`${mailItems.scannedAt} >= ${from}`);
    if (to) mailConditions.push(sql`${mailItems.scannedAt} <= ${to}`);
    if (clientId) mailConditions.push(eq(mailItems.clientId, clientId));

    const data = await db
      .select({
        type: mailItems.type,
        status: mailItems.status,
        client_id: mailItems.clientId,
        scanned_at: mailItems.scannedAt,
      })
      .from(mailItems)
      .where(mailConditions.length > 0 ? and(...mailConditions) : undefined)
      .orderBy(desc(mailItems.scannedAt));

    const count = data.length;

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const item of data || []) {
      const typeStr = item.type as string;
      const statusStr = item.status as string;
      byType[typeStr] = (byType[typeStr] || 0) + 1;
      byStatus[statusStr] = (byStatus[statusStr] || 0) + 1;
    }

    const totalCheques = byType["cheque"] || 0;
    const totalMails =
      (byType["letter"] || 0) + (byType["package"] || 0) + (byType["legal"] || 0);

    // Active companies.
    let activeCompanies = 0;
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

    // Pending cheque requests (clientDecision='pending').
    let pendingRequests = 0;
    if (user.role === "admin") {
      const pendingRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(cheques)
        .where(eq(cheques.clientDecision, "pending"));
      pendingRequests = Number(pendingRes[0]?.count || 0);
    } else {
      const pendingRes = await db
        .select({ id: cheques.id })
        .from(cheques)
        .innerJoin(mailItems, eq(cheques.mailItemId, mailItems.id))
        .where(and(eq(cheques.clientDecision, "pending"), eq(mailItems.clientId, clientId!)));
      pendingRequests = pendingRes.length;
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
