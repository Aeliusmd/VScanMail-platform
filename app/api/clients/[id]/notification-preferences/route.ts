import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { clientNotificationPreferences } from "@/lib/modules/core/db/schema";

const prefsSchema = z.object({
  emailEnabled: z.boolean(),
  newMailScanned: z.boolean(),
  newChequeScanned: z.boolean(),
  deliveryUpdates: z.boolean(),
  depositUpdates: z.boolean(),
  weeklySummary: z.boolean(),
});

type Prefs = z.infer<typeof prefsSchema>;

const DEFAULT_PREFS: Prefs = {
  emailEnabled: true,
  newMailScanned: true,
  newChequeScanned: true,
  deliveryUpdates: true,
  depositUpdates: false,
  weeklySummary: true,
};

function canAccessClientPrefs(actor: Awaited<ReturnType<typeof withAuth>>, clientId: string) {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return true;
  if (actor.role === "client") return actor.clientId === clientId;
  return false;
}

function toFrontend(row: typeof clientNotificationPreferences.$inferSelect): Prefs & { updatedAt: string } {
  return {
    emailEnabled: row.emailEnabled,
    newMailScanned: row.newMailScanned,
    newChequeScanned: row.newChequeScanned,
    deliveryUpdates: row.deliveryUpdates,
    depositUpdates: row.depositUpdates,
    weeklySummary: row.weeklySummary,
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
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

    const rows = await db
      .select()
      .from(clientNotificationPreferences)
      .where(eq(clientNotificationPreferences.clientId, clientId))
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json({
        ...DEFAULT_PREFS,
        updatedAt: new Date(0).toISOString(),
      });
    }

    return NextResponse.json(toFrontend(rows[0]));
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
    withRole(actor, ["admin", "super_admin", "client"]);

    const { id: clientId } = await params;

    if (!canAccessClientPrefs(actor, clientId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = prefsSchema.parse(body);
    const now = new Date();

    await db
      .insert(clientNotificationPreferences)
      .values({
        clientId,
        emailEnabled: data.emailEnabled,
        newMailScanned: data.newMailScanned,
        newChequeScanned: data.newChequeScanned,
        deliveryUpdates: data.deliveryUpdates,
        depositUpdates: data.depositUpdates,
        weeklySummary: data.weeklySummary,
        updatedBy: actor.id,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          emailEnabled: data.emailEnabled,
          newMailScanned: data.newMailScanned,
          newChequeScanned: data.newChequeScanned,
          deliveryUpdates: data.deliveryUpdates,
          depositUpdates: data.depositUpdates,
          weeklySummary: data.weeklySummary,
          updatedBy: actor.id,
          updatedAt: now,
        },
      });

    const rows = await db
      .select()
      .from(clientNotificationPreferences)
      .where(eq(clientNotificationPreferences.clientId, clientId))
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
    }

    return NextResponse.json(toFrontend(rows[0]));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

