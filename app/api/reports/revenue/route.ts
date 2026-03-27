import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { db } from "@/lib/db/mysql";
import { usageEvents } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const data = await db
      .select({
        event_type: usageEvents.eventType,
        quantity: usageEvents.quantity,
        total_cost: usageEvents.totalCost,
        created_at: usageEvents.createdAt,
      })
      .from(usageEvents);

    let totalRevenue = 0;
    const byEvent: Record<string, { count: number; revenue: number }> = {};
    for (const e of data || []) {
      const cost = Number(e.total_cost || 0);
      totalRevenue += cost;
      if (!byEvent[e.event_type]) byEvent[e.event_type] = { count: 0, revenue: 0 };
      byEvent[e.event_type].count += e.quantity;
      byEvent[e.event_type].revenue += cost;
    }

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      breakdown: byEvent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
