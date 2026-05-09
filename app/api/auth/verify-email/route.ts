import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/modules/auth/auth.schema";
import { authService } from "@/lib/modules/auth/auth.service";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = verifyEmailSchema.parse(body);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const emailKey = email.toLowerCase();
    if (
      !(await rateLimit(`verify-email:ip:${ip}`, 20, 15 * 60_000)) ||
      !(await rateLimit(`verify-email:email:${emailKey}`, 5, 15 * 60_000))
    ) {
      return NextResponse.json({ error: "Too many verification attempts." }, { status: 429 });
    }
    const result = await authService.verifyEmail(email, otp, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 400 }
    );
  }
}
