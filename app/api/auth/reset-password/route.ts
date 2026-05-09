import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { authService } from "@/lib/modules/auth/auth.service";

const schema = z.object({
  email: z.string().email("Invalid email address."),
  otp: z.string().length(6, "Code must be 6 digits.").regex(/^\d{6}$/, "Code must be 6 digits."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, otp, newPassword } = schema.parse(body);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 5 attempts per email per 15 minutes — brute-force protection
    const ok = await rateLimit(`reset-pwd:${email}:${ip}`, 5, 15 * 60_000);
    if (!ok) {
      return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
    }

    await authService.resetPassword(email, otp, newPassword, req);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    const msg = error?.message || "Failed to reset password.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
