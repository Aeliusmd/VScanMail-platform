// ---- app/api/mail/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { mailItemModel } from "@/lib/models/mail-item.model";
import { mailQuerySchema } from "@/lib/validators/mail.schema";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = mailQuerySchema.parse(params);

    const clientId = user.role === "admin" ? params.clientId : user.clientId!;
    const result = await mailItemModel.listByClient(clientId, query);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
