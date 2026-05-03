import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { invoiceModel, type InvoiceStatus } from "@/lib/modules/billing/invoice.model";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";
import { stripe } from "@/lib/modules/billing/stripe.config";

export const dynamic = "force-dynamic";

const PRICE_BY_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER ?? "___"]: "starter",
  [process.env.STRIPE_PRICE_PROFESSIONAL ?? "___"]: "professional",
  [process.env.STRIPE_PRICE_ENTERPRISE ?? "___"]: "enterprise",
};

function safeStatus(s: string): InvoiceStatus {
  const allowed: InvoiceStatus[] = ["paid", "open", "void", "uncollectible", "draft"];
  return allowed.includes(s as InvoiceStatus) ? (s as InvoiceStatus) : "draft";
}

/** Pull all Stripe invoices for a customer and persist them to the DB. */
async function syncFromStripe(clientId: string, stripeCustomerId: string): Promise<void> {
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const inv of page.data) {
      if (!inv.id) continue;

      const priceId = (inv.lines?.data?.[0] as any)?.price?.id as string | undefined;
      const planTier = priceId ? (PRICE_BY_PLAN[priceId] ?? null) : null;

      const paidAt =
        inv.status_transitions?.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000)
          : inv.status === "paid"
          ? new Date((inv as any).created * 1000)
          : null;

      try {
        await invoiceModel.createFromStripe({
          clientId,
          stripeInvoiceId: inv.id,
          stripeSubscriptionId: typeof inv.subscription === "string" ? inv.subscription : null,
          invoiceNumber: inv.number ?? null,
          status: safeStatus(inv.status ?? "draft"),
          amountDue: inv.amount_due ?? 0,
          amountPaid: inv.amount_paid ?? 0,
          currency: inv.currency ?? "usd",
          planTier,
          description:
            inv.description ??
            (planTier
              ? `VScanMail ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} — ${new Date((inv as any).created * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
              : null),
          pdfUrl: inv.invoice_pdf ?? null,
          hostedUrl: inv.hosted_invoice_url ?? null,
          periodStart: inv.period_start ? new Date(inv.period_start * 1000) : null,
          periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
          paidAt,
        });
      } catch {
        // Non-fatal: duplicate entries are ignored by onDuplicateKeyUpdate
      }
    }

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) {
      return NextResponse.json({ error: "Missing client context" }, { status: 400 });
    }

    let invoices = await invoiceModel.listByClient(user.clientId);

    // Lazy sync: if no local invoices exist, pull from Stripe once and retry
    if (invoices.length === 0) {
      const sub = await subscriptionModel.findByClient(user.clientId);
      if (sub?.stripe_customer_id) {
        try {
          await syncFromStripe(user.clientId, sub.stripe_customer_id);
          invoices = await invoiceModel.listByClient(user.clientId);
        } catch (syncErr) {
          console.error("Stripe invoice sync failed:", syncErr);
          // Return empty list rather than erroring — sync can be retried next request
        }
      }
    }

    return NextResponse.json({ invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load invoices.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
