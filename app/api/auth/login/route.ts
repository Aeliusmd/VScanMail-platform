import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/modules/auth/auth.schema";
import { authService } from "@/lib/modules/auth/auth.service";
import bcrypt from "bcryptjs";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken } from "@/lib/modules/auth/jwt";

import { auditService } from "@/lib/modules/audit/audit.service";

export async function POST(req: NextRequest) {
  let user: any = null;
  let body: any = null;
  try {
    body = await req.json();
    const { email, password, totpCode } = loginSchema.parse(body);
    console.log("Login attempt for:", email);

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    user = userRows[0];
    if (!user) throw new Error("Invalid email or password");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid email or password");
    
    // 2. Verify 2FA if enabled
    if (totpCode) {
      const valid = await authService.verify2FA(user.id, totpCode);
      if (!valid) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
      }
    }

    // 3. Obtain Role from Profiles
    const profileRows = await db
      .select({ role: profiles.role, clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const role = profileRows[0]?.role || "client";
    const clientId = profileRows[0]?.clientId;

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
      after: { email: user.email, role },
      req,
    });

    return NextResponse.json({
      session: { access_token },
      user: { id: user.id, email: user.email, role, clientId },
    });

  } catch (error: any) {
    // Log failed login attempt with extra safety
    try {
      await auditService.log({
        actor: "system",
        actor_role: "admin",
        action: "auth.login_failed",
        entity: user?.id || (body?.email ? String(body.email).slice(0, 36) : "unknown"),
        after: { error: error.message, email: body?.email },
        req,
      });
    } catch (logError) {
      console.error("[LOGIN_AUTH_LOG_FAILURE]", logError);
    }

    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}

