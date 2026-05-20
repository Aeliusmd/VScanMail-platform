import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/modules/auth/auth.service";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  type: z.enum(["email", "code"]),
  code: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type, code } = schema.parse(body);

    if (type === "email") {
      const result = await authService.recoverAccountWithBackupEmail(email, code, req);
      return NextResponse.json(result);
    } else {
      const result = await authService.recoverAccountWithRecoveryCode(email, code, req);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
