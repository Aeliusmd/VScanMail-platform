import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { deliveryModel } from "@/lib/modules/records/delivery.model";
import { vSendDocsClient } from "@/lib/modules/vsendocs/vsendocs.client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;
    const recordRow = await deliveryModel.findRecordRowById(id);
    if (!recordRow) {
      return NextResponse.json({ error: "Delivery record not found" }, { status: 400 });
    }

    const submissionId = String(recordRow.delivery_vsendocs_submission_id || "").trim();
    if (!submissionId) {
      return NextResponse.json(
        { error: "No vSendDocs submission found for this delivery" },
        { status: 400 }
      );
    }

    const status = await vSendDocsClient.getStatus(submissionId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

