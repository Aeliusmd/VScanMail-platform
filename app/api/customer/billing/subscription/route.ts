import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { stripeService } from "@/lib/modules/billing/stripe.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
  prorationBehavior: z.enum(["always_invoice", "none"]).optional().default("always_invoice"),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) {
      return NextResponse.json({ error: "Missing client context" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid planId." }, { status: 400 });
    }

    const result = await stripeService.changePlan(
      user.clientId,
      parsed.data.planId,
      parsed.data.prorationBehavior
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Plan change failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
