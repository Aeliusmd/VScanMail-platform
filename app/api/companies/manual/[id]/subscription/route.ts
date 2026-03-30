import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { manualClientModel } from "@/lib/models/manual-client.model";
import { updateSubscriptionSchema } from "@/lib/validators/company.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const body = await req.json();
    const data = updateSubscriptionSchema.parse(body);

    const updated = await manualClientModel.updateSubscription(params.id, data);

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
