import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryService } from "@/lib/modules/records/delivery.service";

const requestDeliverySchema = z.object({
  addressId: z.string().min(1),
  preferredDate: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing" }, { status: 400 });
    if (!rateLimit(`customer:delivery:request:mail:${user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json();
    const input = requestDeliverySchema.parse(body);

    const result = await deliveryService.requestDelivery({
      recordId: id,
      addressId: input.addressId,
      preferredDate: input.preferredDate,
      notes: input.notes,
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing" }, { status: 400 });
    if (!rateLimit(`customer:delivery:cancel:mail:${user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { id } = await params;
    const result = await deliveryService.cancelRequest({
      recordId: id,
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
