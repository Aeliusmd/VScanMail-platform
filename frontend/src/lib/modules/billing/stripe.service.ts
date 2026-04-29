import { stripe } from "@/lib/modules/billing/stripe.config";
import { clientModel } from "@/lib/modules/clients/client.model";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const PRICE_BY_PLAN: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

function normalizePlanTier(planId: string): "starter" | "professional" | "enterprise" | null {
  if (planId === "starter" || planId === "professional" || planId === "enterprise") {
    return planId;
  }
  return null;
}

export const stripeService = {
  resolvePriceIdForPlan(planId: string) {
    const tier = normalizePlanTier(planId);
    if (!tier) {
      throw new Error("Invalid planId. Expected starter, professional, or enterprise.");
    }

    const priceId = PRICE_BY_PLAN[tier];
    if (!priceId) {
      throw new Error(`Stripe price is not configured for plan '${tier}'.`);
    }

    return { tier, priceId };
  },

  async createCustomer(email: string, name: string) {
    return stripe.customers.create({ email, name });
  },

  async createCheckoutSession(
    clientId: string,
    priceId: string,
    options?: { successUrl?: string; cancelUrl?: string }
  ) {
    const sub = await subscriptionModel.findByClient(clientId);
    const successUrl = options?.successUrl || `${APP_URL}/dashboard?checkout=success`;
    const cancelUrl = options?.cancelUrl || `${APP_URL}/pricing?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: sub?.stripe_customer_id || undefined,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { clientId },
    });

    return { sessionId: session.id, url: session.url };
  },

  async createTopupSession(clientId: string, amount: number) {
    const sub = await subscriptionModel.findByClient(clientId);

    const session = await stripe.checkout.sessions.create({
      customer: sub?.stripe_customer_id || undefined,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: { name: "VScanMail Wallet Top-Up" },
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard/billing?topup=success`,
      cancel_url: `${APP_URL}/dashboard/billing?topup=cancel`,
      metadata: { clientId, type: "topup", amount: String(amount) },
    });

    return { sessionId: session.id, url: session.url };
  },

  async createPortalSession(stripeCustomerId: string) {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing`,
    });
    return { url: session.url };
  },

  async handleWebhookEvent(event: any) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const clientId = session.metadata?.clientId;
        if (!clientId) break;

        if (session.mode === "subscription") {
          await clientModel.update(clientId, { status: "active", client_type: "subscription" });
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const line = sub.items?.data?.[0];
          const priceId = line?.price?.id;
          let planTier: "starter" | "professional" | "enterprise" = "starter";

          if (priceId) {
            const resolved = (Object.entries(PRICE_BY_PLAN).find(
              ([, value]) => value === priceId
            )?.[0] || "starter") as "starter" | "professional" | "enterprise";
            planTier = resolved;
          }

          await subscriptionModel.upsert({
            client_id: clientId,
            stripe_customer_id:
              typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
            stripe_subscription_id: sub.id,
            plan_tier: planTier,
            status: "active",
            current_period_start: new Date(
              sub.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              sub.current_period_end * 1000
            ).toISOString(),
          });
        }

        if (session.metadata?.type === "topup") {
          // Wallet logic removed for V2, could log to manualPayments instead
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const existing = await subscriptionModel.findByStripeSubscriptionId(sub.id);
        const line = sub.items?.data?.[0];
        const priceId = line?.price?.id;
        const mappedTier = priceId
          ? (Object.entries(PRICE_BY_PLAN).find(([, value]) => value === priceId)?.[0] as
              | "starter"
              | "professional"
              | "enterprise"
              | undefined)
          : undefined;

        await subscriptionModel.upsert({
          client_id: existing?.client_id,
          stripe_customer_id:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
          stripe_subscription_id: sub.id,
          plan_tier: mappedTier ?? existing?.plan_tier ?? "starter",
          status: sub.status,
          current_period_start: new Date(
            sub.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
        });

        // Auto-suspend on past_due
        if (sub.status === "past_due") {
          // Handle suspension logic
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const clientId = sub.metadata?.clientId;
        if (clientId) {
          await clientModel.update(clientId, { status: "suspended" });
        }
        break;
      }

      case "invoice.paid": {
        // Invoice tracking handled here
        break;
      }
    }
  },
};
