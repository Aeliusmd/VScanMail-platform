import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { z } from "zod";

const schema = z.object({
  otp: z.string().min(6).max(6),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const body = await req.json().catch(() => ({}));
    const { otp } = schema.parse(body);

    const result = await authService.verifyBackupEmailOTP(user.id, otp, req);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 400 });
  }
}
