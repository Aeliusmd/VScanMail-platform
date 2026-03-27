// ---- app/api/billing/usage/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { billingService } from "@/lib/services/supporting.services";
import { usageQuerySchema } from "@/lib/validators/billing.schema";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = usageQuerySchema.parse(params);

    const result = await billingService.getUsageSummary(
      user.clientId!,
      query.from,
      query.to
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
