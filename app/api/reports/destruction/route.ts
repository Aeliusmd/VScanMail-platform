import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "operator"]);

    const daysAhead = req.nextUrl.searchParams.get("days") || "7";
    const beforeDate = dayjs()
      .add(parseInt(daysAhead), "day")
      .format("YYYY-MM-DD");

    const items = await mailItemModel.getDestructionDue(beforeDate);

    return NextResponse.json({
      dueForDestruction: items,
      total: items.length,
      beforeDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
