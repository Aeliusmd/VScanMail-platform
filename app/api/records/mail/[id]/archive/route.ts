import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    const { id } = await params;

    if (user.role === "client") {
      if (!user.clientId) {
        return NextResponse.json({ error: "Missing client context" }, { status: 400 });
      }

      const item = await mailItemModel.findById(id);
      if (item.client_id !== user.clientId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } else {
      withRole(user, ["operator", "admin", "super_admin"]);
    }

    await mailItemModel.archive(id, user.id, req as unknown as Request);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Archive failed" }, { status: 400 });
  }
}
