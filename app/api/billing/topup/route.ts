import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { topupSchema } from "@/lib/validators/billing.schema";
import { stripeService } from "@/lib/services/stripe.service";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const body = await req.json();
    const { amount } = topupSchema.parse(body);

    const result = await stripeService.createTopupSession(
      user.clientId!,
      amount
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
