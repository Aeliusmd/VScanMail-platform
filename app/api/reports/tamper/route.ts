// ---- app/api/reports/tamper/route.ts content ----
// Returns all tamper incidents within a date range
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { db } from "@/lib/db/mysql";
import { mailItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const data = await db
      .select({
        id: mailItems.id,
        irn: mailItems.irn,
        client_id: mailItems.clientId,
        tamper_detected: mailItems.tamperDetected,
        tamper_annotations: mailItems.tamperAnnotations,
        scanned_at: mailItems.scannedAt,
      })
      .from(mailItems)
      .where(eq(mailItems.tamperDetected, true))
      .orderBy(desc(mailItems.scannedAt))
      .limit(100);

    return NextResponse.json({ incidents: data, total: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
