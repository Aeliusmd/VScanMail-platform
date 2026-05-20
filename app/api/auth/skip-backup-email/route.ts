import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { authService } from "@/lib/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const result = await authService.skipBackupEmail(user.id, req);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to skip backup email" }, { status: 400 });
  }
}
