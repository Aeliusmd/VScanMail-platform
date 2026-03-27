import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { notificationService } from "@/lib/services/supporting.services";
import { supabaseAdmin } from "@/lib/config/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const { id } = await params;

    const { data: cheques, error } = await supabaseAdmin
      .from("cheques")
      .select("*, mail_items!inner(client_id)")
      .eq("deposit_batch_id", id);

    if (error) throw error;

    await Promise.all(
      (cheques || []).map(async (q: any) => {
        const clientId = q?.mail_items?.client_id;
        if (!clientId) return;
        await notificationService.sendChequeAlert(
          clientId,
          q,
          q.ai_raw_result
        );
      })
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend deposit notifications" },
      { status: 400 }
    );
  }
}

