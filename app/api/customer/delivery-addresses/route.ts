import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { createDeliveryAddressSchema } from "@/lib/modules/delivery/address.schema";
import { deliveryAddressService } from "@/lib/modules/delivery/address.service";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });

    const ok = rateLimit(`customer:delivery-addresses:list:${user.id}`, 120, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const addresses = await deliveryAddressService.listForClient(user.clientId);
    return NextResponse.json({ deliveryAddresses: addresses });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error?.message || "Failed to fetch delivery addresses" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });

    const ok = rateLimit(`customer:delivery-addresses:create:${user.id}`, 30, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const input = createDeliveryAddressSchema.parse(body);
    const address = await deliveryAddressService.createForClient({
      actorId: user.id,
      actorRole: user.role as any,
      clientId: user.clientId,
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
    return NextResponse.json({ error: error?.message || "Failed to create delivery address" }, { status: 400 });
  }
}
