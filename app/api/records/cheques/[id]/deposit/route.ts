import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { depositService } from "@/lib/modules/records/deposit.service";

const requestDepositSchema = z.object({
  destinationBankAccountId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing" }, { status: 400 });

    const { id } = await params;
    const body = await req.json();
    const input = requestDepositSchema.parse(body);

    const result = await depositService.requestDeposit({
      chequeId: id,
      destinationBankAccountId: input.destinationBankAccountId,
      actorId: user.id,
      actorRole: "client",
      clientId: user.clientId,
      req,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing" }, { status: 400 });

    const { id } = await params;

    const result = await depositService.cancelRequest({
      chequeId: id,
      actorId: user.id,
      actorRole: "client",
      clientId: user.clientId,
      req,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

