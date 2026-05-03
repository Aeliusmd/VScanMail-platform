// ---- app/api/cheques/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { customerHiddenModel } from "@/lib/modules/records/customer-hidden.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin", "super_admin"]);

    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get("archived");
    const clientIdParam = searchParams.get("clientId") || undefined;
    const archived =
      archivedParam === null
        ? undefined
        : archivedParam === "true"
          ? true
          : archivedParam === "false"
            ? false
            : undefined;

    // Admins can view cheques across clients (optionally scoped by clientId).
    // Clients only see their own.
    const result =
      user.role === "admin" || user.role === "super_admin"
        ? await chequesListForAdmin(req, archived, clientIdParam)
        : await chequesListForClient(req, user.clientId!, archived);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

async function chequesListForAdmin(
  req: NextRequest,
  archived?: boolean,
  clientId?: string
) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1") || 1;
  const limit = Number(searchParams.get("limit") || "100") || 100;
  const status = searchParams.get("status") || undefined;
  if (clientId) {
    return chequeModel.listByClient(clientId, page, limit, archived, status);
  }
  return chequeModel.listAllGlobal({ page, limit, status, archived });
}

async function chequesListForClient(
  req: NextRequest,
  clientId: string,
  archived?: boolean
) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1") || 1;
  const limit = Number(searchParams.get("limit") || "100") || 100;
  const status = searchParams.get("status") || undefined;
  const hiddenIds = await customerHiddenModel.getHiddenIds(clientId);
  return chequeModel.listByClient(clientId, page, limit, archived, status, hiddenIds);
}
