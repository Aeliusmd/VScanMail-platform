import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { depositBatchModel } from "@/lib/models/shared.models";
import { z } from "zod";

const updateBatchSchema = z.object({
  status: z.enum(["pending", "deposited", "confirmed"]).optional(),
  bankReference: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const { id } = await params;
    const body = await req.json();
    const input = updateBatchSchema.parse(body);

    const batch = await depositBatchModel.update(id, {
      ...(input.status && { status: input.status }),
      ...(input.bankReference && { bank_reference: input.bankReference }),
    });

    return NextResponse.json(batch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
