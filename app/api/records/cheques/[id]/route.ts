import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { chequeModel } from "@/lib/modules/records/cheque.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(req);
    const { id } = await params;
    const cheque = await chequeModel.findById(id);
    return NextResponse.json(cheque);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
