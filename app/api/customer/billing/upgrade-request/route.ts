import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { z } from "zod";
import { clientModel } from "@/lib/modules/clients/client.model";
import { auditService } from "@/lib/modules/audit/audit.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  planId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) throw new Error("ClientId missing for user");
    const clientId = user.clientId;

    const body = await req.json();
    const parsed = schema.parse(body);

    const client = await clientModel.findById(clientId);
    if (client.client_type !== "manual") {
      return NextResponse.json(
        { error: "Only manual plan customers can request a subscription upgrade." },
        { status: 403 }
      );
    }

    await auditService.log({
      actor: user.id,
      actor_role: "client",
      action: "billing.upgrade_request_created",
      entity: crypto.randomUUID(),
      clientId,
      after: { planId: parsed.planId },
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

