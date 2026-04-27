import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { deliveryService } from "@/lib/modules/records/delivery.service";

const markInTransitSchema = z.object({
  submissionId: z.string().trim().max(64).optional(),
  submissionNumber: z.string().trim().max(64).optional(),
  trackingNumber: z.string().trim().min(2).max(128),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);
    if (!rateLimit(`admin:deliveries:in-transit:${user.id}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json();
    const input = markInTransitSchema.parse(body);

    const result = await deliveryService.adminMarkInTransit({
      recordId: id,
      actorId: user.id,
      actorRole: user.role as any,
      submissionId: input.submissionId,
      submissionNumber: input.submissionNumber,
      trackingNumber: input.trackingNumber,
      req,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
