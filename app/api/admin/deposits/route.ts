import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { depositService } from "@/lib/modules/records/deposit.service";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const ok = await rateLimit(`admin:deposits:list:${user.id}`, 240, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const result = await depositService.adminList({ limit: 500 });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[admin/deposits] GET failed:", error);
    return NextResponse.json({ error: "Failed to load deposits" }, { status: 500 });
  }
}

