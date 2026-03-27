// ---- app/api/cheques/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { chequeModel } from "@/lib/models/cheque.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);
    const result = await chequeModel.listByClient(user.clientId!);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
