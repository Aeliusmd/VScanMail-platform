import { stripe } from "@/lib/modules/billing/stripe.config";
import { clientModel } from "@/lib/modules/clients/client.model";
import { invoiceModel } from "@/lib/modules/billing/invoice.model";
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
      payment_method_collection: "always",
      payment_method_options: {
        card: { request_three_d_secure: "automatic" },
      },
      allow_promotion_codes: false,
      subscription_data: {
        metadata: { clientId },
      },
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

  async changePlan(
    clientId: string,
    newPlanId: string,
    prorationBehavior: "always_invoice" | "none" = "always_invoice"
  ) {
    const { tier, priceId } = this.resolvePriceIdForPlan(newPlanId);
    const sub = await subscriptionModel.findByClient(clientId);
    if (!sub?.stripe_subscription_id) {
      throw new Error("No active subscription found for this client.");
    }

    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const currentItemId = stripeSub.items.data[0]?.id;
    if (!currentItemId) throw new Error("No subscription item found.");

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: currentItemId, price: priceId }],
      proration_behavior: prorationBehavior,
      metadata: { clientId },
    });

    await subscriptionModel.upsert({
      client_id: clientId,
      stripe_subscription_id: updated.id,
      stripe_customer_id:
        typeof updated.customer === "string" ? updated.customer : updated.customer?.id ?? null,
      plan_tier: tier,
      status: updated.status as any,
      current_period_start: new Date(updated.current_period_start * 1000).toISOString(),
      current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
    });

    return { planTier: tier, status: updated.status };
  },

  async handleWebhookEvent(event: any) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const clientId = session.metadata?.clientId;
        if (!clientId) break;

        if (session.mode === "subscription") {
          const stripeSub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const line = stripeSub.items?.data?.[0];
          const priceId = line?.price?.id;
          let planTier: "starter" | "professional" | "enterprise" = "starter";

          if (priceId) {
            const resolved = Object.entries(PRICE_BY_PLAN).find(
              ([, value]) => value === priceId
            )?.[0];
            if (resolved === "professional" || resolved === "enterprise" || resolved === "starter") {
              planTier = resolved;
            }
          }

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
            current_period_start: new Date(
              stripeSub.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              stripeSub.current_period_end * 1000
            ).toISOString(),
            failed_payment_count: 0,
            grace_period_until: null,
            payment_failed_at: null,
          });
        }

        if (session.metadata?.type === "topup") {
          // Wallet logic removed for V2, could log to manualPayments instead
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const inv = event.data.object;
        const stripeSubId = inv.subscription as string | null;
        if (!stripeSubId) break;

        const sub = await subscriptionModel.findByStripeSubscriptionId(stripeSubId);
        if (!sub?.client_id) break;

        await subscriptionModel.clearGracePeriod(stripeSubId);
        await clientModel.update(sub.client_id, {
          status: "active",
          suspended_reason: null,
        });

        try {
          await invoiceModel.createFromStripe({
            clientId: sub.client_id,
            stripeInvoiceId: inv.id,
            stripeSubscriptionId: stripeSubId,
            invoiceNumber: inv.number ?? null,
            status: "paid",
            amountDue: inv.amount_due ?? 0,
            amountPaid: inv.amount_paid ?? 0,
            currency: inv.currency ?? "usd",
            planTier: sub.plan_tier ?? null,
            description:
              inv.description ??
              `VScanMail ${sub.plan_tier ?? ""} - ${new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}`,
            pdfUrl: inv.invoice_pdf ?? null,
            hostedUrl: inv.hosted_invoice_url ?? null,
            periodStart: inv.period_start ? new Date(inv.period_start * 1000) : null,
            periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
            paidAt: new Date(),
          });
        } catch (invoiceErr) {
          console.error("Failed to save invoice record:", invoiceErr);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const stripeSubId = invoice.subscription as string | null;
        if (!stripeSubId) break;

        const sub = await subscriptionModel.findByStripeSubscriptionId(stripeSubId);
        if (!sub) break;

        const failedAt = new Date();
        const existingFailCount = sub.failed_payment_count ?? 0;

        await subscriptionModel.startGracePeriod(stripeSubId, failedAt, existingFailCount);
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object;
        const existing = await subscriptionModel.findByStripeSubscriptionId(stripeSub.id);
        const line = stripeSub.items?.data?.[0];
        const priceId = line?.price?.id;
        const mappedTier = priceId
          ? (Object.entries(PRICE_BY_PLAN).find(([, value]) => value === priceId)?.[0] as
              | "starter"
              | "professional"
              | "enterprise"
              | undefined)
          : undefined;
        const clientId = existing?.client_id ?? stripeSub.metadata?.clientId;
        if (!clientId) break;

        const newStatus = stripeSub.status;

        await subscriptionModel.upsert({
          client_id: clientId,
          stripe_customer_id:
            typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id ?? null,
          stripe_subscription_id: stripeSub.id,
          plan_tier: mappedTier ?? existing?.plan_tier ?? "starter",
          status: newStatus,
          current_period_start: new Date(
            stripeSub.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            stripeSub.current_period_end * 1000
          ).toISOString(),
        });

        if (newStatus === "active") {
          await subscriptionModel.clearGracePeriod(stripeSub.id);
          await clientModel.update(clientId, {
            status: "active",
            suspended_reason: null,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object;
        const sub = await subscriptionModel.findByStripeSubscriptionId(stripeSub.id);
        const clientId = sub?.client_id ?? stripeSub.metadata?.clientId;
        if (clientId) {
          await clientModel.update(clientId, {
            status: "suspended",
            suspended_reason: "payment_overdue",
          });
        }

        await subscriptionModel.upsert({
          client_id: clientId,
          stripe_subscription_id: stripeSub.id,
          stripe_customer_id:
            typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id ?? null,
          status: "canceled",
          plan_tier: sub?.plan_tier ?? "starter",
          current_period_start: sub?.current_period_start ?? new Date().toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        });
        break;
      }

      case "invoice.paid": {
        // invoice.payment_succeeded handles grace-period clearing.
        break;
      }
    }
  },
};
