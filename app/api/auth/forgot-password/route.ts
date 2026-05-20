import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { authService } from "@/lib/modules/auth/auth.service";

const schema = z.object({
  email: z.string().email("Invalid email address."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = schema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 3 requests per email per 15 minutes — prevent OTP spam
    const okByEmail = await rateLimit(`forgot-pwd:email:${normalizedEmail}`, 3, 15 * 60_000);
    const okByIp = await rateLimit(`forgot-pwd:ip:${ip}`, 10, 15 * 60_000);

    if (!okByEmail || !okByIp) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    await authService.forgotPassword(normalizedEmail, req);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    const message = error?.message || "Failed to send password reset code.";
    if (message.includes("No account exists")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("[forgot-password]", message);
    return NextResponse.json({ error: "Failed to send password reset code. Please try again." }, { status: 500 });
  }
}
