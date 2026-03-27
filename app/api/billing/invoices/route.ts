import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { invoiceModel } from "@/lib/models/shared.models";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);
    const invoices = await invoiceModel.listByClient(user.clientId!);
    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
