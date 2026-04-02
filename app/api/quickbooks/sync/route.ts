// ---- app/api/quickbooks/sync/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    // TODO: Implement QuickBooks invoice sync
    // 1. Fetch unsyncied invoices from DB
    // 2. Push each to QuickBooks via their API
    // 3. Mark as synced

    return NextResponse.json({
      message: "QuickBooks sync — implementation pending",
      status: "not_implemented",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
