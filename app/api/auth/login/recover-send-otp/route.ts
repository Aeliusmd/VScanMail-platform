import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/modules/auth/auth.service";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const result = await authService.sendRecoveryEmailOTP(email, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
