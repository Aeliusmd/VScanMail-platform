import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { customerHiddenModel } from "@/lib/modules/records/customer-hidden.model";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin", "super_admin"]);

    const body = await req.json();
    const { action, ids } = body as { action: "archive" | "unarchive" | "delete"; ids: string[] };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "action and ids are required" }, { status: 400 });
    }

    if (action === "archive") {
      await Promise.all(ids.map((id) => chequeModel.archive(id, user.id, req as unknown as Request)));
    } else if (action === "unarchive") {
      await Promise.all(ids.map((id) => chequeModel.unarchive(id, user.id, req as unknown as Request)));
    } else if (action === "delete") {
      await Promise.all(
        ids.map(async (id) => {
          await chequeModel.delete(id, user.id, req as unknown as Request);
          await customerHiddenModel.cleanupRecord(id);
        })
      );
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Bulk action failed" }, { status: 400 });
  }
}
