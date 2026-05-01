import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/modules/billing/stripe.config";
import { stripeService } from "@/lib/modules/billing/stripe.service";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = bodySchema.parse(await req.json());
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== "subscription") {
      return NextResponse.json(
        { active: false, error: "Checkout session is not a subscription." },
        { status: 400 }
      );
    }

    if (session.status !== "complete") {
      return NextResponse.json({ active: false, status: session.status });
    }

    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return NextResponse.json({
        active: false,
        status: session.status,
        paymentStatus: session.payment_status,
      });
    }

    if (!session.metadata?.clientId || !session.subscription) {
      return NextResponse.json(
        { active: false, error: "Checkout session is missing subscription metadata." },
        { status: 400 }
      );
    }

    // Reuse the existing webhook activation path for the post-redirect race in local/dev.
    await stripeService.handleWebhookEvent({
      type: "checkout.session.completed",
      data: { object: session },
    });

    return NextResponse.json({ active: true });
  } catch (error: any) {
    return NextResponse.json(
      { active: false, error: error.message || "Could not confirm checkout." },
      { status: 400 }
    );
  }
}
