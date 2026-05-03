import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import Stripe from "stripe";
import { db } from "../lib/modules/core/db/mysql";
import { subscriptions } from "../lib/modules/core/db/schema";
import { invoiceModel, type InvoiceStatus } from "../lib/modules/billing/invoice.model";
import { isNotNull } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Reverse-map Stripe price ID → plan tier name
const PRICE_BY_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER ?? ""]: "starter",
  [process.env.STRIPE_PRICE_PROFESSIONAL ?? ""]: "professional",
  [process.env.STRIPE_PRICE_ENTERPRISE ?? ""]: "enterprise",
};

function resolvePlanTier(stripeInvoice: Stripe.Invoice): string | null {
  const priceId = (stripeInvoice.lines?.data?.[0] as any)?.price?.id as string | undefined;
  if (!priceId) return null;
  return PRICE_BY_PLAN[priceId] ?? null;
}

function safeStatus(s: string): InvoiceStatus {
  const allowed: InvoiceStatus[] = ["paid", "open", "void", "uncollectible", "draft"];
  return allowed.includes(s as InvoiceStatus) ? (s as InvoiceStatus) : "draft";
}

async function syncCustomer(clientId: string, stripeCustomerId: string): Promise<number> {
  let saved = 0;
  let starting_after: string | undefined;

  // Paginate through ALL invoices for this customer
  while (true) {
    const page = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100,
      ...(starting_after ? { starting_after } : {}),
    });

    for (const inv of page.data) {
      if (!inv.id) continue;

      const planTier = resolvePlanTier(inv);
      const paidAt = inv.status_transitions?.paid_at
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
        saved++;
      } catch (err) {
        console.error(`    ✗ Failed to save invoice ${inv.id}:`, (err as Error).message);
      }
    }

    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
  }

  return saved;
}

async function main() {
  console.log("\n=== Stripe Invoice Backfill ===\n");

  // Load all subscriptions that have a Stripe customer ID
  const subs = await db
    .select({
      clientId: subscriptions.clientId,
      stripeCustomerId: subscriptions.stripeCustomerId,
      planTier: subscriptions.planTier,
    })
    .from(subscriptions)
    .where(isNotNull(subscriptions.stripeCustomerId));

  if (subs.length === 0) {
    console.log("No subscriptions with a Stripe customer ID found. Nothing to sync.");
    process.exit(0);
  }

  console.log(`Found ${subs.length} subscription(s) to sync.\n`);

  let totalSaved = 0;
  let totalFailed = 0;

  for (const sub of subs) {
    const customerId = sub.stripeCustomerId!;
    process.stdout.write(`  Client ${sub.clientId} (${customerId}) ... `);

    try {
      const saved = await syncCustomer(sub.clientId, customerId);
      totalSaved += saved;
      console.log(`${saved} invoice(s) synced`);
    } catch (err) {
      totalFailed++;
      console.log(`FAILED — ${(err as Error).message}`);
    }
  }

  console.log(`\n✅ Done. ${totalSaved} invoice(s) saved across ${subs.length} customer(s).`);
  if (totalFailed > 0) {
    console.log(`⚠  ${totalFailed} customer(s) failed — check errors above.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Backfill failed:", err);
  process.exit(1);
});
