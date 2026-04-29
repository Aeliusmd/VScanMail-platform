import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";
import { stripeService } from "@/lib/modules/billing/stripe.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const clientId = user.clientId;
    if (!clientId) {
      return NextResponse.json({ error: "Missing client context" }, { status: 400 });
    }

    const body = await req.json();
    const { planId } = schema.parse(body);

    const client = await clientModel.findById(clientId);
    if (client.client_type !== "manual") {
      return NextResponse.json(
        { error: "Only manual plan customers can start upgrade checkout." },
        { status: 400 }
      );
    }

    const { priceId } = stripeService.resolvePriceIdForPlan(planId);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured." }, { status: 400 });
    }

    const result = await stripeService.createCheckoutSession(clientId, priceId, {
      successUrl: `${appUrl}/customer/account?tab=billing&checkout=success`,
      cancelUrl: `${appUrl}/customer/account?tab=billing&checkout=cancel`,
    });

    return NextResponse.json({ url: result.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to start checkout." },
      { status: 400 }
    );
  }
}
