// ---- app/api/mail/[id]/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";

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
