import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { stripeService } from "@/lib/modules/billing/stripe.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const clientId = user.clientId;
    if (!clientId) {
      return NextResponse.json({ error: "Missing client context" }, { status: 400 });
    }

    const appUrl = (process.env.CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "")
      .trim()
      .replace(/\/$/, "");
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured." }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Missing or invalid planId." }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid planId. Expected starter, professional, or enterprise." },
        { status: 400 }
      );
    }

    let priceId: string;
    try {
      priceId = stripeService.resolvePriceIdForPlan(parsed.data.planId).priceId;
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid planId." },
        { status: 400 }
      );
    }

    const result = await stripeService.createCheckoutSession(clientId, priceId, {
      successUrl: `${appUrl}/customer/${encodeURIComponent(clientId)}/account?tab=billing&checkout=success`,
      cancelUrl: `${appUrl}/customer/${encodeURIComponent(clientId)}/account?tab=billing&checkout=cancel`,
    });

    return NextResponse.json({ url: result.url });
  } catch (error: unknown) {
    if (error instanceof Response) return error;

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start checkout." },
      { status: 500 }
    );
  }
}
