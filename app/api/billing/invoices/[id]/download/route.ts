import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { invoiceModel } from "@/lib/modules/billing/invoice.model";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const { id } = await params;
    const invoice = await invoiceModel.findById(id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.client_id !== user.clientId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (!invoice.pdf_url) {
      return NextResponse.json({ error: "PDF not available for this invoice." }, { status: 404 });
    }

    const pdfRes = await fetch(invoice.pdf_url);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF from Stripe." }, { status: 502 });
    }
    const pdfBuffer = await pdfRes.arrayBuffer();
    const filename = invoice.invoice_number
      ? `invoice-${invoice.invoice_number}.pdf`
      : `invoice-${id}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Download failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
