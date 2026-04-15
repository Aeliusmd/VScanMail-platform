// ---- app/api/cheques/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);

    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get("archived");
    const archived =
      archivedParam === null
        ? undefined
        : archivedParam === "true"
          ? true
          : archivedParam === "false"
            ? false
            : undefined;

    // Admins can view all cheques across clients. Clients only see their own.
    const result =
      user.role === "admin"
        ? await chequesListForAdmin(req, archived)
        : await chequesListForClient(req, user.clientId!, archived);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

async function chequesListForAdmin(req: NextRequest, archived?: boolean) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1") || 1;
  const limit = Number(searchParams.get("limit") || "100") || 100;
  const status = searchParams.get("status") || undefined;
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
  return chequeModel.listByClient(clientId, page, limit, archived);
}
