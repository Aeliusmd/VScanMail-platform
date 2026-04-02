// ---- app/api/reports/tamper/route.ts content ----
// Returns all tamper incidents within a date range
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    if (!allClients.length) {
      return NextResponse.json({ incidents: [], total: 0 });
    }

    const queries = allClients.map((c) =>
      sql`SELECT id, irn, ${c.id} AS client_id, tamper_detected, tamper_annotations, scanned_at 
          FROM ${sql.raw(`\`${c.tableName}\``)} 
          WHERE tamper_detected = 1`
    );
    const unionQuery = sql.join(queries, sql` UNION ALL `);
    const finalQuery = sql`${unionQuery} ORDER BY scanned_at DESC LIMIT 100`;

    const [data] = await db.execute(finalQuery) as any;

    return NextResponse.json({ incidents: data, total: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
