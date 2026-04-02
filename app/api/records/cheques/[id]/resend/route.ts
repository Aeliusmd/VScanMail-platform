import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { notificationService } from "@/lib/modules/notifications/notification.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "operator", "admin"]);

    const { id } = await params;
    const cheque = await chequeModel.findById(id);

    const mailItems = (cheque as any).mail_items;
    const clientId = mailItems?.client_id || user.clientId;
    if (!clientId) {
      return NextResponse.json({ error: "Unable to resolve client" }, { status: 400 });
    }

    const validation = (cheque as any).ai_raw_result;
    await notificationService.sendChequeAlert(clientId, cheque, validation);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend cheque email" },
      { status: 400 }
    );
  }
}

