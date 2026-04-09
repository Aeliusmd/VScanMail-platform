import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { notificationService } from "@/lib/modules/notifications/notification.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(req);

    const { id } = await params;
    const item = await mailItemModel.findById(id);

    // Resend based on type and tamper state.
    if (item.tamper_detected) {
      await notificationService.sendTamperAlert(item.client_id, item);
    } else if (item.type === 'cheque') {
      await notificationService.sendChequeAlert(item.client_id, item, {
        status: item.cheque_status || 'validated',
        confidence: item.cheque_ai_confidence || 0.95
      });
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

