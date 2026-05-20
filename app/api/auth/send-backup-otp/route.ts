import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { z } from "zod";

const schema = z.object({
  backupEmail: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const body = await req.json().catch(() => ({}));
    const { backupEmail } = schema.parse(body);

    const result = await authService.sendBackupEmailOTP(user.id, backupEmail, req);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 400 });
  }
}
