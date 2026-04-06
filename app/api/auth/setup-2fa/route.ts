import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";
import { setup2faSchema } from "@/lib/modules/auth/auth.schema";

// GET — generate QR code + secret
export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const result = await authService.setup2FA(user.id, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST — confirm 2FA with TOTP code
export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const body = await req.json();
    const { totpCode } = setup2faSchema.parse(body);
    const result = await authService.confirm2FA(user.id, totpCode, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
