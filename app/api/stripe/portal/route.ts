import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { clientModel } from "@/lib/models/client.model";
import { stripeService } from "@/lib/services/stripe.service";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    const client = await clientModel.findById(user.clientId!);
    if (!client.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const result = await stripeService.createPortalSession(
      client.stripe_customer_id
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
