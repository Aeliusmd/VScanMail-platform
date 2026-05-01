import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) {
      return NextResponse.json({ error: "Missing client context" }, { status: 400 });
    }

    const sub = await subscriptionModel.findByClient(user.clientId);
    if (!sub) {
      return NextResponse.json({
        status: "none",
        planTier: null,
        currentPeriodEnd: null,
        gracePeriodUntil: null,
        isInGracePeriod: false,
        graceExpired: false,
        failedPaymentCount: 0,
      });
    }

    const now = new Date();
    const gracePeriodUntil = sub.grace_period_until;
    const isInGracePeriod =
      sub.status === "past_due" &&
      gracePeriodUntil != null &&
      new Date(gracePeriodUntil) > now;

    const graceExpired =
      sub.status === "past_due" &&
      gracePeriodUntil != null &&
      new Date(gracePeriodUntil) <= now;

    return NextResponse.json({
      status: sub.status,
      planTier: sub.plan_tier,
      currentPeriodEnd: sub.current_period_end,
      gracePeriodUntil,
      isInGracePeriod,
      graceExpired,
      failedPaymentCount: sub.failed_payment_count,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load billing status.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
