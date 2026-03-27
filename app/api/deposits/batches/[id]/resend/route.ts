import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { notificationService } from "@/lib/services/supporting.services";
import { db } from "@/lib/db/mysql";
import { cheques, mailItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const { id } = await params;

    const chequesData = await db
      .select({
        cheque: cheques,
        clientId: mailItems.clientId,
      })
      .from(cheques)
      .innerJoin(mailItems, eq(cheques.mailItemId, mailItems.id))
      .where(eq(cheques.depositBatchId, id));

    await Promise.all(
      chequesData.map(async (row) => {
        const clientId = row.clientId;
        const q = row.cheque;
        if (!clientId) return;
        await notificationService.sendChequeAlert(
          clientId,
          q,
          q.aiRawResult
        );
      })
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend deposit notifications" },
      { status: 400 }
    );
  }
}

