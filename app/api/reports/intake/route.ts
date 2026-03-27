// ---- app/api/reports/intake/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { supabaseAdmin } from "@/lib/config/supabase";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    // Dashboard cards are shown for both admin and client roles.
    withRole(user, ["admin", "client"]);

    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const clientId = user.role === "admin" ? null : user.clientId!;

    // Mail aggregates.
    let mailQuery = supabaseAdmin
      .from("mail_items")
      .select("type, status, client_id, scanned_at", { count: "exact" });

    if (from) mailQuery = mailQuery.gte("scanned_at", from);
    if (to) mailQuery = mailQuery.lte("scanned_at", to);
    if (clientId) mailQuery = mailQuery.eq("client_id", clientId);

    const { data, count, error } = await mailQuery.order("scanned_at", {
      ascending: false,
    });
    if (error) throw error;

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const item of data || []) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    }

    const totalCheques = byType["cheque"] || 0;
    const totalMails =
      (byType["letter"] || 0) + (byType["package"] || 0) + (byType["legal"] || 0);

    // Active companies.
    let activeCompanies = 0;
    if (user.role === "admin") {
      const { data: clients, error: clientsErr } = await supabaseAdmin
        .from("clients")
        .select("id", { count: "exact" })
        .eq("status", "active");
      if (clientsErr) throw clientsErr;
      activeCompanies = clients?.length || 0;
    } else {
      const { data: me, error: meErr } = await supabaseAdmin
        .from("clients")
        .select("status")
        .eq("id", clientId)
        .single();
      if (meErr) throw meErr;
      activeCompanies = me?.status === "active" ? 1 : 0;
    }

    // Pending cheque requests (client_decision='pending').
    let pendingRequests = 0;
    if (user.role === "admin") {
      const { count: pendingCount, error: pendingErr } = await supabaseAdmin
        .from("cheques")
        .select("id", { count: "exact" })
        .eq("client_decision", "pending");
      if (pendingErr) throw pendingErr;
      pendingRequests = pendingCount || 0;
    } else {
      const { count: pendingCount, error: pendingErr } = await supabaseAdmin
        .from("cheques")
        .select("id, mail_items!inner(client_id)", { count: "exact" })
        .eq("client_decision", "pending")
        .eq("mail_items.client_id", clientId);
      if (pendingErr) throw pendingErr;
      pendingRequests = pendingCount || 0;
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
