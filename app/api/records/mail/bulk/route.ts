import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { customerHiddenModel } from "@/lib/modules/records/customer-hidden.model";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);

    const body = await req.json();
    const { action, ids } = body as { action: "archive" | "unarchive" | "delete" | "mark_read"; ids: string[] };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "action and ids are required" }, { status: 400 });
    }

    if (user.role === "client") {
      if (!user.clientId) {
        return NextResponse.json({ error: "Missing client context" }, { status: 400 });
      }

      const items = await Promise.all(ids.map((id) => mailItemModel.findById(id)));
      if (items.some((item) => item.client_id !== user.clientId)) {
        return NextResponse.json({ error: "One or more records were not found" }, { status: 404 });
      }

      if (action === "archive") {
        await Promise.all(ids.map((id) => mailItemModel.archive(id, user.id, req as unknown as Request)));
      } else if (action === "unarchive") {
        await Promise.all(ids.map((id) => mailItemModel.unarchive(id, user.id, req as unknown as Request)));
      } else if (action === "mark_read") {
        await Promise.all(ids.map((id) => mailItemModel.update(id, { status: "processed" }, user.id, req as unknown as Request)));
      } else if (action === "delete") {
        await customerHiddenModel.hide(user.clientId, ids);
      } else {
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }

      return NextResponse.json({ success: true, count: ids.length });
    }

    withRole(user, ["operator", "admin", "super_admin"]);

    if (action === "archive") {
      await Promise.all(ids.map((id) => mailItemModel.archive(id, user.id, req as unknown as Request)));
    } else if (action === "unarchive") {
      await Promise.all(ids.map((id) => mailItemModel.unarchive(id, user.id, req as unknown as Request)));
    } else if (action === "mark_read") {
      await Promise.all(ids.map((id) => mailItemModel.update(id, { status: "processed" }, user.id, req as unknown as Request)));
    } else if (action === "delete") {
      await Promise.all(
        ids.map(async (id) => {
          await mailItemModel.delete(id, user.id, req as unknown as Request);
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
