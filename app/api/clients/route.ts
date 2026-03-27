// ---- app/api/clients/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { clientModel } from "@/lib/models/client.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

    const result = await clientModel.list(page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
