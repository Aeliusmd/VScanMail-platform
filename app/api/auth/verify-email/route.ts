import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/modules/auth/auth.schema";
import { authService } from "@/lib/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = verifyEmailSchema.parse(body);
    const result = await authService.verifyEmail(email, otp, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 400 }
    );
  }
}
