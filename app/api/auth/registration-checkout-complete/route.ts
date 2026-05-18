import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/modules/billing/stripe.config";
import { stripeService } from "@/lib/modules/billing/stripe.service";
import { clientModel } from "@/lib/modules/clients/client.model";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken } from "@/lib/modules/auth/jwt";
import { auditService } from "@/lib/modules/audit/audit.service";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email } = bodySchema.parse(await req.json());
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

    const client = await clientModel.findById(clientId);
    const registeredEmail = String(client.email || "").toLowerCase();
    if (!registeredEmail || registeredEmail !== email.toLowerCase()) {
      return NextResponse.json({ active: false, error: "Checkout verification failed." }, { status: 403 });
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

    // Look up the user via profiles table and create the same short-lived session as normal login.
    // Stripe has already confirmed this checkout session is complete and paid for this client.
    const profileRows = await db
      .select({ userId: profiles.userId, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.clientId, clientId))
      .limit(1);
    const profileRow = profileRows[0];

    if (!profileRow?.userId) {
      return NextResponse.json({ active: true });
    }

    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, profileRow.userId))
      .limit(1);
    const user = userRows[0];

    if (!user) {
      return NextResponse.json({ active: true });
    }

    const role = profileRow.role ?? "client";
    const accessToken = await signAccessToken({ sub: user.id, email: user.email });

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    await auditService.log({
      actor: user.id,
      actor_role: role as any,
      action: "auth.login",
      entity: user.id,
      clientId,
      after: { role, source: "registration_checkout" },
      req,
    });

    const res = NextResponse.json({
      active: true,
      user: { id: user.id, email: user.email, role, clientId },
      autoLoggedIn: true,
    });
    res.cookies.set("sb-access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    return res;
  } catch (error: any) {
    console.error("[registration-checkout-complete]", error?.message || error);
    return NextResponse.json(
      { active: false, error: "Could not confirm checkout." },
      { status: 400 }
    );
  }
}
