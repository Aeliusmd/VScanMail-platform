// ---- app/api/mail/[id]/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { customerHiddenModel } from "@/lib/modules/records/customer-hidden.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    const { id } = await params;
    const item = await mailItemModel.findById(id);
    return NextResponse.json(item);
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
      // The record stays in the DB and admins can still see it.
      if (!user.clientId) {
        return NextResponse.json({ error: "Missing client context" }, { status: 400 });
      }
      await customerHiddenModel.hide(user.clientId, [id]);
      return NextResponse.json({ success: true });
    }

    // Admin / operator: permanent hard delete.
    withRole(user, ["operator", "admin"]);
    await mailItemModel.delete(id, user.id, req as unknown as Request);
    // Clean up any customer soft-delete entries for this record.
    await customerHiddenModel.cleanupRecord(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status?: "received" | "scanned" | "processed" | "delivered" };

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const updated = await mailItemModel.update(id, { status });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
