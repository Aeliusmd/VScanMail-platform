import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import { chequeModel } from "@/lib/models/cheque.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(req);

    const { id } = await params;
    const cheque = await chequeModel.findById(id);

    const mailItems = (cheque as any).mail_items;
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

