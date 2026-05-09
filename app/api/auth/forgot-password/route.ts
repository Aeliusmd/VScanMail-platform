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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 3 requests per email per 15 minutes — prevent OTP spam
    const okByEmail = await rateLimit(`forgot-pwd:email:${email}`, 3, 15 * 60_000);
    const okByIp = await rateLimit(`forgot-pwd:ip:${ip}`, 10, 15 * 60_000);

    if (!okByEmail || !okByIp) {
      // Return ok:true to avoid confirming the email exists
      return NextResponse.json({ ok: true });
    }

    await authService.forgotPassword(email, req);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    console.error("[forgot-password]", error?.message);
    return NextResponse.json({ ok: true }); // still return ok — no info leak
  }
}
