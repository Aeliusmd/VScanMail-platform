import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { updateSubscriptionSchema } from "@/lib/modules/clients/client.schema";
import { db } from "@/lib/modules/core/db/mysql";
import { subscriptions, clients } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const body = await req.json();
    const data = updateSubscriptionSchema.parse(body);
    const clientId = (await params).id;

    // Verify client exists
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) throw new Error("Client not found");

    // Upsert the subscription
    const existingSubs = await db.select().from(subscriptions).where(eq(subscriptions.clientId, clientId));
    
    if (existingSubs.length > 0) {
      await db.update(subscriptions)
        .set({
          planTier: (data.subscriptionPlan as any) === "none" ? "starter" : data.subscriptionPlan as any,
          monthlyAmount: String(data.subscriptionAmount),
          status: data.subscriptionStatus as any,
          updatedAt: new Date() as any,
        })
        .where(eq(subscriptions.id, existingSubs[0].id));
    } else {
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        clientId: clientId,
        planTier: (data.subscriptionPlan as any) === "none" ? "starter" : data.subscriptionPlan as any,
        monthlyAmount: String(data.subscriptionAmount),
        status: data.subscriptionStatus as any,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      });
    }

    // Also update client status based on subscription
    await db.update(clients)
      .set({ status: data.subscriptionStatus === "active" ? "active" : "suspended" })
      .where(eq(clients.id, clientId));

    // For frontend compatibility, return updated full mock
    return NextResponse.json({ success: true, company: { id: clientId, status: data.subscriptionStatus } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
