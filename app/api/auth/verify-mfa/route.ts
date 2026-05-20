import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { authService } from "@/lib/modules/auth/auth.service";
import { db } from "@/lib/modules/core/db/mysql";
import { clients, profiles, users } from "@/lib/modules/core/db/schema";
import { signAccessToken, verifyMfaTempToken } from "@/lib/modules/auth/jwt";
import { auditService } from "@/lib/modules/audit/audit.service";

const schema = z.object({
  tempToken: z.string().min(1),
  totpCode: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const { tempToken, totpCode } = schema.parse(await req.json());
    const decoded = await verifyMfaTempToken(tempToken);

    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, decoded.sub))
      .limit(1);
    const user = userRows[0];
    if (!user || user.email !== decoded.email) {
      return NextResponse.json({ error: "Invalid MFA token" }, { status: 401 });
    }

    const valid = await authService.verify2FA(user.id, totpCode);
    if (!valid) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
    }

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

    const accessToken = await signAccessToken({ sub: user.id, email: user.email });
    db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).catch(() => {});

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
    res.cookies.set("sb-access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "MFA verification failed" },
      { status: 401 }
    );
  }
}
