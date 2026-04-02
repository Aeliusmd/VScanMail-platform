import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(req);

    const { id } = await params;
    const item = await mailItemModel.findById(id);

    return NextResponse.json({
      id: item.id,
      irn: item.irn,
      type: item.type,
      status: item.status,
      frontUrl: item.envelope_front_url,
      backUrl: item.envelope_back_url,
      contentUrls: item.content_scan_urls,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch download URLs" },
      { status: 400 }
    );
  }
}

