import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/modules/core/db/mysql";
import { clients, profiles, users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { stripeService } from "@/lib/modules/billing/stripe.service";

const bodySchema = z.object({
  email: z.string().email(),
  planId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());

    const userRows = await db
      .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    const user = userRows[0];
    if (!user?.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Email must be verified before checkout." },
        { status: 403 }
      );
    }

    const profileRows = await db
      .select({ clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    const clientId = profileRows[0]?.clientId;
    if (!clientId) {
      return NextResponse.json({ error: "No organization for this account." }, { status: 400 });
    }

    const clientRows = await db
      .select({
        status: clients.status,
        clientType: clients.clientType,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    const client = clientRows[0];
    if (!client || client.status !== "pending") {
      return NextResponse.json(
        { error: "Subscription checkout is not available for this account." },
        { status: 400 }
      );
    }
    if (client.clientType !== "subscription") {
      return NextResponse.json(
        { error: "This account does not use subscription checkout." },
        { status: 400 }
      );
    }

    const { priceId } = stripeService.resolvePriceIdForPlan(body.planId);
    // Same as customer billing checkout: browser routes (login, verify-email) live on the
    // customer frontend origin; API may run on a different port (e.g. 3010 vs 3000).
    const appUrl = (process.env.CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "")
      .trim()
      .replace(/\/$/, "");
    if (!appUrl) {
      return NextResponse.json(
        { error: "Set CUSTOMER_APP_URL or NEXT_PUBLIC_APP_URL for post-checkout redirects." },
        { status: 500 }
      );
    }

    const successUrl = `${appUrl}/login?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/verify-email?email=${encodeURIComponent(body.email)}&checkout=cancel&plan=${encodeURIComponent(body.planId)}`;

    const { url } = await stripeService.createCheckoutSession(clientId, priceId, {
      successUrl,
      cancelUrl,
    });
    if (!url) {
      return NextResponse.json({ error: "Could not start Stripe Checkout." }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Checkout failed" },
      { status: 400 }
    );
  }
}
