import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { deliveryModel } from "@/lib/modules/records/delivery.model";
import { vSendDocsClient } from "@/lib/modules/vsendocs/vsendocs.client";

function decodeBase64ToBuffer(b64: string): Buffer {
  return Buffer.from(String(b64 || ""), "base64");
}

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
    const submissionNumber = String(recordRow.delivery_vsendocs_submission_number || "").trim();
    if (!submissionId) {
      return NextResponse.json(
        { error: "No vSendDocs submission found for this delivery" },
        { status: 400 }
      );
    }

    const pos = await vSendDocsClient.getProofOfService(submissionId);
    const pdf = decodeBase64ToBuffer(pos.proofOfServicePdfBase64);

    const filename = submissionNumber
      ? `ProofOfService_${submissionNumber}.pdf`
      : `ProofOfService_${id}.pdf`;

    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

