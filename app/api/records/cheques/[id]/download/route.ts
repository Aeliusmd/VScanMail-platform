import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);

    const { id } = await params;
    const cheque = await chequeModel.findById(id);
    if (user.role === "client" && cheque.mail_items?.client_id !== user.clientId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const mailItems = cheque.mail_items;
    return NextResponse.json({
      id: cheque.id,
      frontUrl: mailItems?.envelope_front_url || null,
      backUrl: mailItems?.envelope_back_url || null,
      contentUrls: mailItems?.content_scan_urls || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch cheque download URLs" },
      { status: 400 }
    );
  }
}

