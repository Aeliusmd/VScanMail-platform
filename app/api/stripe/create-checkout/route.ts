import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { stripeService } from "@/lib/services/stripe.service";
import { z } from "zod";

const checkoutSchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const body = await req.json();
    const { priceId } = checkoutSchema.parse(body);

    const result = await stripeService.createCheckoutSession(
      user.clientId!,
      priceId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
