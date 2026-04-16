import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { notificationPreferencesService } from "@/lib/modules/notifications/notification-preferences.service";

const prefsSchema = z.object({
  emailEnabled: z.boolean(),
  newMailScanned: z.boolean(),
  newChequeScanned: z.boolean(),
  deliveryUpdates: z.boolean(),
  depositUpdates: z.boolean(),
  weeklySummary: z.boolean(),
});

function canAccessClientPrefs(actor: Awaited<ReturnType<typeof withAuth>>, clientId: string) {
  if (actor.role === "super_admin") return true;
  if (actor.role === "client") return actor.clientId === clientId;
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await withAuth(req);
    const { id: clientId } = await params;

    if (!canAccessClientPrefs(actor, clientId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolved = await notificationPreferencesService.getResolvedForClient(clientId);

    return NextResponse.json({
      emailEnabled: resolved.emailEnabled,
      newMailScanned: resolved.newMailScanned,
      newChequeScanned: resolved.newChequeScanned,
      deliveryUpdates: resolved.deliveryUpdates,
      depositUpdates: resolved.depositUpdates,
      weeklySummary: resolved.weeklySummary,
      capabilities: resolved.capabilities,
      planTier: resolved.planTier,
      legacyPlan: resolved.legacyPlan,
      updatedAt: (resolved.updatedAt ?? new Date(0)).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await withAuth(req);
    withRole(actor, ["super_admin", "client"]);

    const { id: clientId } = await params;

    if (!canAccessClientPrefs(actor, clientId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = prefsSchema.parse(body);

    await notificationPreferencesService.upsertWithCapabilities(clientId, data, actor.id);

    const resolved = await notificationPreferencesService.getResolvedForClient(clientId);

    return NextResponse.json({
      emailEnabled: resolved.emailEnabled,
      newMailScanned: resolved.newMailScanned,
      newChequeScanned: resolved.newChequeScanned,
      deliveryUpdates: resolved.deliveryUpdates,
      depositUpdates: resolved.depositUpdates,
      weeklySummary: resolved.weeklySummary,
      capabilities: resolved.capabilities,
      planTier: resolved.planTier,
      legacyPlan: resolved.legacyPlan,
      updatedAt: (resolved.updatedAt ?? new Date()).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
