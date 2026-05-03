import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { customerHiddenModel } from "@/lib/modules/records/customer-hidden.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(req);
    const { id } = await params;
    const cheque = await chequeModel.findById(id);
    return NextResponse.json(cheque);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    const { id } = await params;

    if (user.role === "client") {
      // Soft delete: hide from this customer's view only.
      if (!user.clientId) {
        return NextResponse.json({ error: "Missing client context" }, { status: 400 });
      }
      await customerHiddenModel.hide(user.clientId, [id]);
      return NextResponse.json({ success: true });
    }

    // Admin / operator: permanent hard delete.
    withRole(user, ["operator", "admin"]);
    await chequeModel.delete(id, user.id, req as unknown as Request);
    // Clean up any customer soft-delete entries for this record.
    await customerHiddenModel.cleanupRecord(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
