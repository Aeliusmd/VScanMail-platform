import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { manualPaymentModel } from "@/lib/modules/billing/manual-payment.model";
import { z } from "zod";

const manualPaymentSchema = z.object({
  clientId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["cash", "bank_transfer", "cheque", "other", "card"]),
  referenceNo: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string(),
  periodCovered: z.enum(["monthly", "quarterly", "annual", "custom"]),
  durationMonths: z.number().int().min(1).default(1),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin"]);

    const body = await req.json();
    const data = manualPaymentSchema.parse(body);

    const record = await manualPaymentModel.create({
      client_id: data.clientId,
      recorded_by: user.id,
      amount: data.amount,
      payment_method: data.paymentMethod,
      reference_no: data.referenceNo,
      receipt_url: data.receiptUrl,
      notes: data.notes,
      payment_date: data.paymentDate,
      period_covered: data.periodCovered,
      duration_months: data.durationMonths,
      period_start: data.periodStart,
      period_end: data.periodEnd,
    }, req);

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin", "admin"]);

    const clientId = req.nextUrl.searchParams.get("clientId");
    
    if (clientId) {
      const history = await manualPaymentModel.listByClient(clientId);
      return NextResponse.json(history);
    }

    const all = await manualPaymentModel.listAll();
    return NextResponse.json(all);
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
    const data = manualPaymentSchema.partial().parse(body);

    const record = await manualPaymentModel.update(id, {
      ...data,
      client_id: undefined, // Cannot change client ID
      recorded_by: user.id,
    } as any, req);

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["super_admin"]);

    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new Error("ID is required");

    await manualPaymentModel.delete(id, user.id, req);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
