import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";
import { stripeService } from "@/lib/modules/billing/stripe.service";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const sub = await subscriptionModel.findByClient(user.clientId!);
    if (!sub || !sub.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const result = await stripeService.createPortalSession(
      sub.stripe_customer_id
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
