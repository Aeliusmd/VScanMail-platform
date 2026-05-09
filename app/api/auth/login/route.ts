import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/modules/auth/auth.schema";
import { authService } from "@/lib/modules/auth/auth.service";
import bcrypt from "bcryptjs";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles, clients } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken } from "@/lib/modules/auth/jwt";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import crypto from "crypto";

import { auditService } from "@/lib/modules/audit/audit.service";

export async function POST(req: NextRequest) {
  let user: any = null;
  let body: any = null;
  try {
    body = await req.json();
    const { email, password, totpCode } = loginSchema.parse(body);
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
      .select()
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

    // 3. Verify client 2FA if enabled. Omitting totpCode must not bypass MFA.
    if (clientId) {
      const valid2fa = await authService.verify2FA(clientId, totpCode || "");
      if (!valid2fa) {
        return NextResponse.json(
          { error: totpCode ? "Invalid 2FA code" : "2FA code required" },
          { status: 401 }
        );
      }
    }

    if (clientId) {
      const clientRows = await db
        .select({ status: clients.status })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      const clientStatus = clientRows[0]?.status;
      if (clientStatus === "pending") {
        return NextResponse.json(
          {
            error:
              "Your subscription payment is still processing. Please wait a moment, then try signing in again.",
          },
          { status: 403 }
        );
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

    const access_token = await signAccessToken({ sub: user.id, email: user.email });

    // Update last login timestamp
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

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
