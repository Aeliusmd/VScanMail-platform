import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/config/stripe";
import { stripeService } from "@/lib/services/stripe.service";

// Stripe webhooks need raw body — disable body parsing
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await stripeService.handleWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
