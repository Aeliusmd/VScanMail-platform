import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rejectSchema } from "@/lib/modules/records/cheque.schema";
import { chequeService } from "@/lib/modules/records/cheque.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);

    const { id } = await params;
    const body = await req.json();
    const input = rejectSchema.parse(body);

    const result = await chequeService.reject(id, user.id, input.reason, req);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
