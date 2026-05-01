import { NextResponse } from "next/server";
import { billingPlanModel } from "@/lib/modules/billing/billing-plan.model";

export async function GET() {
  try {
    const plans = await billingPlanModel.listAll();
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load registration plans" },
      { status: 400 }
    );
  }
}
