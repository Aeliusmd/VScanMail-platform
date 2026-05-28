import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { depositModel } from "@/lib/modules/records/deposit.model";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) {
      return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });
    }

    const ok = await rateLimit(`customer:deposits:slip:${user.id}`, 30, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { id } = await ctx.params;

    // findChequeRowByClientAndId uses SELECT * so the raw column name deposit_slip_url is returned.
    // It also enforces that the record belongs to the authenticated client's table — ownership is
    // guaranteed at the DB query level (only searches the client's own table).
    const row = await depositModel.findChequeRowByClientAndId(user.clientId, id);

    if (!row) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    // Raw row uses snake_case column names (SELECT *), not the camelCase aliases from listForClient.
    const slipUrl: string | null = row.deposit_slip_url ?? row.slipUrl ?? null;

    if (!slipUrl) {
      return NextResponse.json({ error: "No deposit slip available for this record" }, { status: 404 });
    }

    // Fetch the slip image from its stored URL (e.g. S3 presigned or public URL).
    let imageResponse: Response;
    try {
      imageResponse = await fetch(slipUrl);
    } catch {
      return NextResponse.json({ error: "Failed to retrieve deposit slip" }, { status: 502 });
    }

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Deposit slip could not be fetched" }, { status: 502 });
    }

    const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="deposit-slip-${id}.jpg"`,
        "Content-Length": String(imageBuffer.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[API/Customer/Deposits/Slip] GET Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to download deposit slip" },
      { status: 500 }
    );
  }
}
