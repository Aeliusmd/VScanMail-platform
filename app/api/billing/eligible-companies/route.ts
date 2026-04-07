import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients, manualPayments } from "@/lib/modules/core/db/schema";
import { eq, notInArray, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin"]);

    // Fetch clients that don't have an active manual payment
    // Standard clients (subscription type) can also be added to manual plans if we want to convert them?
    // Requirement said: "currently not to adding manual plan companies"
    
    // Subquery for active manual payment client IDs
    const activeManualPayments = db
      .select({ clientId: manualPayments.clientId })
      .from(manualPayments)
      .where(sql`${manualPayments.periodEnd} > NOW()`);

    const eligibleClients = await db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        clientCode: clients.clientCode,
      })
      .from(clients)
      .where(
        sql`${clients.status} = 'active' AND ${clients.id} NOT IN (
          SELECT client_id FROM manual_payments WHERE period_end > NOW()
        )`
      );

    return NextResponse.json(eligibleClients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
