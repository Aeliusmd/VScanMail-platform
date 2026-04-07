import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { billingPlanModel } from "@/lib/modules/billing/billing-plan.model";
import { z } from "zod";

const billingPlanSchema = z.object({
  name: z.string().optional(),
  price: z.number().nonnegative().optional(),
  max_companies: z.number().int().positive().optional(),
  max_scans: z.number().int().positive().optional(),
  storage: z.string().optional(),
  badge: z.string().nullable().optional(),
  badge_color: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    // Anyone in admin can see plans, but only super admin edits them (checked in PATCH)
    withRole(user, ["super_admin", "admin", "client"]);

    const plans = await billingPlanModel.listAll();
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin"]);

    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new Error("ID is required");

    const body = await req.json();
    const data = billingPlanSchema.parse(body);

    const record = await billingPlanModel.update(id, data, user.id, req);

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
