import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/modules/auth/auth.schema";
import bcrypt from "bcryptjs";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles, clients } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken, signMfaTempToken } from "@/lib/modules/auth/jwt";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";
import { stripe } from "@/lib/modules/billing/stripe.config";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import crypto from "crypto";

import { auditService } from "@/lib/modules/audit/audit.service";

/**
 * When a subscription client is still "pending" after payment, check Stripe directly
 * and activate the account if a valid paid subscription is found.
 * Three-level fallback: DB consistency check → Stripe subscription lookup → Stripe email search.
 */
async function tryActivateByStripe(clientId: string, clientEmail: string): Promise<boolean> {
  const sub = await subscriptionModel.findByClient(clientId).catch(() => null);

  // Level 1: subscription in DB is already "active" but client status wasn't synced
  if (sub?.status === "active") {
    await db.update(clients).set({ status: "active", updatedAt: new Date() }).where(eq(clients.id, clientId));
    return true;
  }

  // Level 2: subscription ID in DB — query Stripe for live status
  if (sub?.stripe_subscription_id) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      if (stripeSub.status === "active") {
        await db.update(clients).set({ status: "active", updatedAt: new Date() }).where(eq(clients.id, clientId));
        return true;
      }
    } catch { /* Stripe unavailable */ }
  }

  // Level 3: no subscription in DB yet (webhook/checkout-complete never ran) — search Stripe by email.
  // Accept "active" or "trialing" — both represent a successfully completed payment/checkout.
  if (!sub) {
    try {
      const customers = await stripe.customers.list({ email: clientEmail, limit: 3 });
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 });
        const hasPaidSub = subs.data.some(
          (s) => s.status === "active" || s.status === "trialing"
        );
        if (hasPaidSub) {
          await db.update(clients).set({ status: "active", updatedAt: new Date() }).where(eq(clients.id, clientId));
          return true;
        }
      }
    } catch { /* Stripe unavailable */ }
  }

  return false;
}

export async function POST(req: NextRequest) {
  let user: any = null;
  let body: any = null;
  try {
    body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const emailKey = email.toLowerCase();
    if (
      !(await rateLimit(`login:ip:${ip}`, 30, 15 * 60_000)) ||
      !(await rateLimit(`login:email:${emailKey}`, 8, 15 * 60_000))
    ) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        emailVerifiedAt: users.emailVerifiedAt,
        totpEnabled: users.totpEnabled,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    user = userRows[0];
    if (!user) throw new Error("Invalid email or password");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid email or password");

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 403 }
      );
    }

    // 2. Obtain Role from Profiles
    const profileRows = await db
      .select({ role: profiles.role, clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const role = profileRows[0]?.role || "client";
    let clientId = profileRows[0]?.clientId;

    if (!clientId) {
      const clientRows = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.id, user.id))
        .limit(1);
      clientId = clientRows[0]?.id;
    }

    if (clientId) {
      const clientRows = await db
        .select({ status: clients.status, clientType: clients.clientType })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      const clientStatus = clientRows[0]?.status;
      const clientType = clientRows[0]?.clientType;

      if (clientStatus === "pending") {
        if (clientType === "subscription") {
          // Payment may have completed but the webhook/redirect missed — check Stripe and auto-activate.
          const activated = await tryActivateByStripe(clientId, user.email);
          if (!activated) {
            return NextResponse.json(
              {
                error:
                  "Your subscription payment is still processing. Please complete payment or wait a moment, then try signing in again.",
              },
              { status: 403 }
            );
          }
          // Activation succeeded — fall through to complete the login.
        } else {
          return NextResponse.json(
            { error: "Your account is pending activation. Please contact your service provider." },
            { status: 403 }
          );
        }
      }

      const sub = await subscriptionModel.findByClient(clientId).catch(() => null);
      if (sub && sub.status === "past_due" && sub.grace_period_until) {
        const gracePeriodExpired = new Date(sub.grace_period_until) < new Date();
        if (gracePeriodExpired) {
          return NextResponse.json(
            {
              error:
                "Your subscription payment is overdue. Please update your payment method to restore access.",
              code: "payment_overdue",
              clientId,
            },
            { status: 402 }
          );
        }
      }
    }

    if (user.totpEnabled) {
      const tempToken = await signMfaTempToken({ sub: user.id, email: user.email });
      return NextResponse.json({ requiresMfa: true, tempToken });
    }

    const access_token = await signAccessToken({ sub: user.id, email: user.email });

    // Update last login timestamp (fire-and-forget — column may not be migrated yet)
    db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).catch(() => {});

    // Log successful login
    await auditService.log({
      actor: user.id,
      actor_role: role as any,
      action: "auth.login",
      entity: user.id,
      clientId: clientId ?? undefined,
      after: { role },
      req,
    });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, role, clientId },
    });
    res.cookies.set("sb-access-token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    return res;

  } catch (error: any) {
    const errorMsg = error?.message || "";
    if (errorMsg.startsWith("PAYMENT_OVERDUE:")) {
      return NextResponse.json(
        {
          error: errorMsg.replace("PAYMENT_OVERDUE: ", ""),
          code: "payment_overdue",
        },
        { status: 402 }
      );
    }

    // Log failed login attempt with extra safety
    try {
      const attemptedEmail = body?.email ? String(body.email).toLowerCase() : "";
      const emailHash = attemptedEmail
        ? crypto.createHash("sha256").update(attemptedEmail).digest("hex")
        : undefined;
      await auditService.log({
        actor: "system",
        actor_role: "admin",
        action: "auth.login_failed",
        entity: user?.id || (emailHash ? emailHash.slice(0, 36) : "unknown"),
        after: { reason: "invalid_login", emailHash },
        req,
      });
    } catch (logError) {
      console.error("[LOGIN_AUTH_LOG_FAILURE]", logError);
    }

    return NextResponse.json(
      { error: "Login failed" },
      { status: 401 }
    );
  }
}
