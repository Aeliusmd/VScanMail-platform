import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { supabaseAdmin } from "@/lib/config/supabase";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { data, error } = await supabaseAdmin
      .from("usage_events")
      .select("event_type, quantity, total_cost, created_at");

    if (error) throw error;

    let totalRevenue = 0;
    const byEvent: Record<string, { count: number; revenue: number }> = {};
    for (const e of data || []) {
      totalRevenue += e.total_cost;
      if (!byEvent[e.event_type]) byEvent[e.event_type] = { count: 0, revenue: 0 };
      byEvent[e.event_type].count += e.quantity;
      byEvent[e.event_type].revenue += e.total_cost;
    }

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      breakdown: byEvent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
