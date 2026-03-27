// ---- app/api/deposits/batches/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { depositBatchModel } from "@/lib/models/shared.models";
import { db } from "@/lib/db/mysql";
import { cheques, mailItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { clientModel } from "@/lib/models/client.model";
import { auditService } from "@/lib/services/supporting.services";
import { z } from "zod";

const createBatchSchema = z.object({
  chequeIds: z.array(z.string().uuid()).min(1),
  bankReference: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const batches = await depositBatchModel.list();

    // Enrich batches with client/company info so the frontend can render without additional calls.
    const enriched = await Promise.all(
      batches.map(async (b) => {
        let company_name: string | null = null;
        let email: string | null = null;

        // Deposit batches contain cheques; all cheques in a batch should belong to the same client.
        const chequeRows = await db
          .select({ clientId: mailItems.clientId })
          .from(cheques)
          .innerJoin(mailItems, eq(cheques.mailItemId, mailItems.id))
          .where(eq(cheques.depositBatchId, b.id))
          .limit(1);

        const clientId = chequeRows?.[0]?.clientId || null;

        if (clientId) {
          const client = await clientModel.findById(clientId);
          company_name = client?.company_name || null;
          email = client?.email || null;
        }

        return {
          ...b,
          company_name,
          email,
        };
      })
    );

    return NextResponse.json({ batches: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const body = await req.json();
    const { chequeIds, bankReference } = createBatchSchema.parse(body);

    // Calculate total amount from cheques
    let totalAmount = 0;
    for (const cid of chequeIds) {
      const cheque = await (await import("@/lib/models/cheque.model")).chequeModel.findById(cid);
      totalAmount += cheque.amount_figures || 0;
    }

    const batch = await depositBatchModel.create({
      batch_date: new Date().toISOString().split("T")[0],
      total_amount: totalAmount,
      cheque_count: chequeIds.length,
      bank_reference: bankReference || null,
      status: "pending",
      created_by: user.id,
    });

    // Assign cheques to batch
    await (await import("@/lib/models/cheque.model")).chequeModel.assignToBatch(chequeIds, batch.id);

    await auditService.log({
      actor: user.id,
      action: "deposit.batch_created",
      entity: batch.id,
      details: { chequeCount: chequeIds.length, totalAmount },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
