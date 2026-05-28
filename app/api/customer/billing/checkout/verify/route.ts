import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { stripe } from "@/lib/modules/billing/stripe.config";
import { clientModel } from "@/lib/modules/clients/client.model";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";

export const dynamic = "force-dynamic";

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Ensure this session belongs to the authenticated client
    if (session.client_reference_id !== user.clientId) {
      return NextResponse.json({ error: "Session does not belong to this client" }, { status: 403 });
    }

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    if (session.mode !== "subscription" || !session.subscription) {
      return NextResponse.json({ error: "Not a subscription session" }, { status: 400 });
    }

    const stripeSub = typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription as any;

    const priceId = stripeSub.items?.data?.[0]?.price?.id;
    let planTier: "starter" | "professional" | "enterprise" = "starter";

    if (priceId) {
      const resolved = Object.entries(PRICE_BY_PLAN).find(([, v]) => v === priceId)?.[0];
      if (resolved === "professional" || resolved === "enterprise" || resolved === "starter") {
        planTier = resolved;
      }
    }

    const clientId = user.clientId!;

    await clientModel.update(clientId, {
      status: "active",
      suspended_reason: null,
      client_type: "subscription",
    });

    await subscriptionModel.upsert({
      client_id: clientId,
      stripe_customer_id:
        typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id ?? null,
      stripe_subscription_id: stripeSub.id,
      plan_tier: planTier,
      status: "active",
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      failed_payment_count: 0,
      grace_period_until: null,
      payment_failed_at: null,
    });

    return NextResponse.json({ success: true, planTier });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
