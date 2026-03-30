import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth.schema";
import { authService } from "@/lib/services/auth.service";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/mysql";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Login attempt for:", body.email);
    const { email, password, totpCode } = loginSchema.parse(body);

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = userRows[0];
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

    const access_token = await signAccessToken({ sub: user.id, email: user.email });

    return NextResponse.json({
      session: { access_token },
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
