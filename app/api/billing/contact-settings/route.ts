import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { billingContactModel } from "@/lib/modules/billing/billing-contact.model";
import { z } from "zod";

export const dynamic = "force-dynamic";

const US_PHONE_RE = /^(\+1 \(\d{3}\) \d{3}-\d{4}|\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/;
const PHONE_MSG = "Use format: +1 (XXX) XXX-XXXX, (XXX) XXX-XXXX, or XXX-XXX-XXXX";

const schema = z.object({
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().refine(v => !v || US_PHONE_RE.test(v), PHONE_MSG).optional(),
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

