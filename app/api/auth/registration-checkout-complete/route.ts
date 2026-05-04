import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/modules/billing/stripe.config";
import { stripeService } from "@/lib/modules/billing/stripe.service";
import { clientModel } from "@/lib/modules/clients/client.model";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken } from "@/lib/modules/auth/jwt";

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

    const clientId = session.metadata?.clientId;
    if (!clientId || !session.subscription) {
      return NextResponse.json(
        { active: false, error: "Checkout session is missing subscription metadata." },
        { status: 400 }
      );
    }

    // Fix 2: Activate org directly first — don't depend on Stripe subscription object being ready.
    await clientModel.update(clientId, {
      status: "active",
      suspended_reason: null,
      client_type: "subscription",
    });

    // Best-effort: upsert subscription record via webhook handler (may fail transiently).
    try {
      await stripeService.handleWebhookEvent({
        type: "checkout.session.completed",
        data: { object: session },
      });
    } catch (webhookErr) {
      console.error("[checkout-complete] webhook handler error (org already activated):", webhookErr);
    }

    // Fix 1: Issue a JWT so the frontend can auto-login without requiring credentials.
    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, clientId))
      .limit(1);
    const user = userRows[0];

    if (!user) {
      return NextResponse.json({ active: true });
    }

    const profileRows = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    const role = profileRows[0]?.role ?? "client";

    const access_token = await signAccessToken({ sub: user.id, email: user.email });

    return NextResponse.json({
      active: true,
      access_token,
      user: { id: user.id, email: user.email, role, clientId },
    });
  } catch (error: any) {
    return NextResponse.json(
      { active: false, error: error.message || "Could not confirm checkout." },
      { status: 400 }
    );
  }
}
