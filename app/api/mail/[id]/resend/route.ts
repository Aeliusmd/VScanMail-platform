import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import { mailItemModel } from "@/lib/models/mail-item.model";
import { notificationService } from "@/lib/services/supporting.services";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(req);

    const { id } = await params;
    const item = await mailItemModel.findById(id);

    // Resend based on tamper state.
    if (item.tamper_detected) {
      await notificationService.sendTamperAlert(item.client_id, item);
    } else {
      await notificationService.sendNewMailAlert(item.client_id, item);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend email" },
      { status: 400 }
    );
  }
}

