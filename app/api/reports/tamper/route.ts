// ---- app/api/reports/tamper/route.ts content ----
// Returns all tamper incidents within a date range
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { supabaseAdmin } from "@/lib/config/supabase";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { data, error } = await supabaseAdmin
      .from("mail_items")
      .select("id, irn, client_id, tamper_detected, tamper_annotations, scanned_at")
      .eq("tamper_detected", true)
      .order("scanned_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ incidents: data, total: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
