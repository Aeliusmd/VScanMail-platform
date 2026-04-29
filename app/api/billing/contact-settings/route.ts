import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { billingContactModel } from "@/lib/modules/billing/billing-contact.model";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(64).optional(),
  contactEmail: z.string().email().max(255).or(z.literal("")).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin", "admin", "client"]);

    const settings = await billingContactModel.get();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin"]);

    const body = await req.json();
    const data = schema.parse(body);

    const saved = await billingContactModel.upsert(data, user.id);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

