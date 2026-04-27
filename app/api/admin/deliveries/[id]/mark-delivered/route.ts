import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryService } from "@/lib/modules/records/delivery.service";

const markDeliveredSchema = z.object({
  proofOfServiceUrl: z.string().trim().url().max(2000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);
    if (!rateLimit(`admin:deliveries:delivered:${user.id}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json();
    const input = markDeliveredSchema.parse(body);

    const result = await deliveryService.adminMarkDelivered({
      recordId: id,
      actorId: user.id,
      actorRole: user.role as any,
      proofOfServiceUrl: input.proofOfServiceUrl,
      req,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
