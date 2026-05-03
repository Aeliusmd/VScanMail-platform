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

    return NextResponse.redirect(invoice.pdf_url, 302);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Download failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
