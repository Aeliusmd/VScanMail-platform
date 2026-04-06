import { stripe } from "@/lib/modules/billing/stripe.config";
import { clientModel } from "@/lib/modules/clients/client.model";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export const stripeService = {
  async createCustomer(email: string, name: string) {
    return stripe.customers.create({ email, name });
  },

  async createCheckoutSession(
    clientId: string,
    priceId: string
  ) {
    const sub = await subscriptionModel.findByClient(clientId);

    const session = await stripe.checkout.sessions.create({
      customer: sub?.stripe_customer_id || undefined,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/pricing?checkout=cancel`,
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
          await clientModel.update(clientId, { status: "active" });
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await subscriptionModel.upsert({
            client_id: clientId,
            stripe_subscription_id: sub.id,
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
        await subscriptionModel.upsert({
          stripe_subscription_id: sub.id,
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
