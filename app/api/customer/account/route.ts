import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
import { clientModel } from "@/lib/modules/clients/client.model";
import { notificationPreferencesService } from "@/lib/modules/notifications/notification-preferences.service";
import { auditService } from "@/lib/modules/audit/audit.service";

const profileSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  contactPerson: z.string().max(500).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(64).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(64).optional(),
  zip: z.string().max(32).optional(),
  website: z.string().max(500).optional(),
  industry: z.string().max(128).optional(),
  employees: z.string().max(32).optional(),
});

const securitySchema = z.object({
  twoFactor: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
  sessionTimeout: z.string().max(8).optional(),
});

const notificationsSchema = z.object({
  newMail: z.boolean().optional(),
  chequeReceived: z.boolean().optional(),
  depositComplete: z.boolean().optional(),
  pickupReady: z.boolean().optional(),
});

const putBodySchema = z.object({
  profile: profileSchema.optional(),
  security: securitySchema.optional(),
  notifications: notificationsSchema.optional(),
});

function contactPersonFromUser(first: string | null | undefined, last: string | null | undefined) {
  return [first, last].filter(Boolean).join(" ").trim();
}

function splitContactPerson(value: string) {
  const t = value.trim();
  const idx = t.search(/\s/);
  if (idx === -1) return { firstName: t || "", lastName: "" };
  return { firstName: t.slice(0, idx).trim(), lastName: t.slice(idx).trim() };
}

function mapPrefsToUi(resolved: Awaited<ReturnType<typeof notificationPreferencesService.getResolvedForClient>>) {
  return {
    newMail: resolved.newMailScanned,
    chequeReceived: resolved.newChequeScanned,
    depositComplete: resolved.depositUpdates,
    pickupReady: resolved.deliveryUpdates,
  };
}

async function buildAccountPayload(clientId: string, userId: string) {
  const client = await clientModel.findById(clientId);
  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRow) throw new Error("User not found");

  const addr = (client.address_json || {}) as {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  const resolved = await notificationPreferencesService.getResolvedForClient(clientId);

  return {
    profile: {
      companyName: client.company_name,
      contactPerson: contactPersonFromUser(userRow.firstName, userRow.lastName),
      email: client.email,
      phone: client.phone,
      address: addr.street ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.zip ?? "",
      website: client.website ?? "",
      industry: client.industry,
      employees: client.employees ?? "",
    },
    bankAccounts: [] as unknown[],
    security: {
      twoFactor: Boolean(client.two_fa_enabled),
      loginAlerts: Boolean(userRow.loginAlertsEnabled ?? true),
      sessionTimeout: userRow.sessionTimeout ?? "30",
    },
    notifications: mapPrefsToUi(resolved),
    avatarUrl: userRow.avatarUrl ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) {
      return NextResponse.json({ error: "No organization linked to this account" }, { status: 400 });
    }

    const payload = await buildAccountPayload(user.clientId, user.id);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    if (error instanceof Response) return error as NextResponse;
    const message = error instanceof Error ? error.message : "Failed to load account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) {
      return NextResponse.json({ error: "No organization linked to this account" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = putBodySchema.parse(body);
    const clientId = user.clientId;

    if (parsed.profile) {
      const p = parsed.profile;
      const before = await clientModel.findById(clientId);
      const addr = (before.address_json || {}) as Record<string, string>;

      const nextAddress = {
        street: p.address !== undefined ? p.address : addr.street ?? "",
        city: p.city !== undefined ? p.city : addr.city ?? "",
        state: p.state !== undefined ? p.state : addr.state ?? "",
        zip: p.zip !== undefined ? p.zip : addr.zip ?? "",
        country: addr.country ?? "US",
      };

      await clientModel.update(
        clientId,
        {
          company_name: p.companyName ?? before.company_name,
          email: p.email ?? before.email,
          phone: p.phone ?? before.phone,
          industry: p.industry ?? before.industry,
          address_json: nextAddress,
          website: p.website !== undefined ? p.website || null : before.website,
          employees: p.employees !== undefined ? p.employees || null : before.employees,
        },
        user.id,
        req
      );

      if (p.contactPerson !== undefined) {
        const { firstName, lastName } = splitContactPerson(p.contactPerson);
        await db
          .update(users)
          .set({
            firstName: firstName || null,
            lastName: lastName || null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    }

    if (parsed.security) {
      const s = parsed.security;
      if (s.twoFactor !== undefined) {
        await clientModel.update(clientId, { two_fa_enabled: s.twoFactor }, user.id, req);
      }
      const userPatch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
      if (s.loginAlerts !== undefined) {
        userPatch.loginAlertsEnabled = s.loginAlerts;
      }
      if (s.sessionTimeout !== undefined) {
        userPatch.sessionTimeout = s.sessionTimeout;
      }
      if (s.loginAlerts !== undefined || s.sessionTimeout !== undefined) {
        await db.update(users).set(userPatch).where(eq(users.id, user.id));
      }
    }

    if (parsed.notifications) {
      const n = parsed.notifications;
      const resolved = await notificationPreferencesService.getResolvedForClient(clientId);
      const next = {
        emailEnabled: resolved.emailEnabled,
        newMailScanned: n.newMail !== undefined ? n.newMail : resolved.newMailScanned,
        newChequeScanned: n.chequeReceived !== undefined ? n.chequeReceived : resolved.newChequeScanned,
        deliveryUpdates: n.pickupReady !== undefined ? n.pickupReady : resolved.deliveryUpdates,
        depositUpdates: n.depositComplete !== undefined ? n.depositComplete : resolved.depositUpdates,
        weeklySummary: resolved.weeklySummary,
      };
      await notificationPreferencesService.upsertWithCapabilities(clientId, next, user.id);
    }

    const payload = await buildAccountPayload(clientId, user.id);

    await auditService.log({
      actor: user.id,
      actor_role: "client",
      action: "customer.account_updated",
      entity: clientId,
      clientId,
      after: { keys: Object.keys(parsed) },
      req,
    });

    return NextResponse.json(payload);
  } catch (error: unknown) {
    if (error instanceof Response) return error as NextResponse;
    const message = error instanceof Error ? error.message : "Failed to save account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
