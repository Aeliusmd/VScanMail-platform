import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { stripeService } from "@/lib/modules/billing/stripe.service";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const body = await req.json();
    const { planId } = checkoutSchema.parse(body);
    const { priceId } = stripeService.resolvePriceIdForPlan(planId);

    const result = await stripeService.createCheckoutSession(
      user.clientId!,
      priceId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
