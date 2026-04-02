// ---- app/api/clients/route.ts ----
// Returns ALL companies from company_directory (self-registered + manually added).
// Used by: scan page forward dropdown, any feature needing a full company list.
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

    const result = await clientModel.list(page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
