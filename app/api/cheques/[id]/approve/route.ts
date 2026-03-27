import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { approveSchema } from "@/lib/validators/cheque.schema";
import { chequeService } from "@/lib/services/cheque.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin"]);

    const { id } = await params;
    const body = await req.json();
    const input = approveSchema.parse(body);

    const result = await chequeService.approve(id, user.id, input.reason);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
