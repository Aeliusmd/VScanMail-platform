import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryAddressService } from "@/lib/modules/delivery/address.service";
import { updateDeliveryAddressSchema } from "@/lib/modules/delivery/address.schema";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });

    const ok = rateLimit(`customer:delivery-addresses:get:${user.id}`, 120, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { id } = await ctx.params;
    const list = await deliveryAddressService.listForClient(user.clientId);
    const address = list.find((r) => r.id === id);
    if (!address) return NextResponse.json({ error: "Delivery address not found" }, { status: 404 });
    return NextResponse.json({ deliveryAddress: address });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to fetch delivery address" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });

    const ok = rateLimit(`customer:delivery-addresses:update:${user.id}`, 60, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateDeliveryAddressSchema.parse(body);
    const address = await deliveryAddressService.updateForClient({
      actorId: user.id,
      actorRole: user.role as any,
      clientId: user.clientId,
      addressId: id,
      input,
      req,
    });
    return NextResponse.json({ deliveryAddress: address });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    if (error instanceof ZodError) {
      const msg = error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Failed to update delivery address" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });

    const ok = rateLimit(`customer:delivery-addresses:delete:${user.id}`, 30, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { id } = await ctx.params;
    await deliveryAddressService.removeForClient({
      actorId: user.id,
      actorRole: user.role as any,
      clientId: user.clientId,
      addressId: id,
      req,
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to delete delivery address" }, { status: 400 });
  }
}
