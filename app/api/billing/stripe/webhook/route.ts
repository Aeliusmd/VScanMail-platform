import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/modules/billing/stripe.config";
import { stripeService } from "@/lib/modules/billing/stripe.service";

// Stripe webhooks need raw body — disable body parsing
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = Buffer.from(await req.arrayBuffer());

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature";
    console.error("Stripe webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await stripeService.handleWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Stripe webhook handler failed";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
