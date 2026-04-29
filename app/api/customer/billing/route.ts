import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";
import { manualPaymentModel } from "@/lib/modules/billing/manual-payment.model";
import { subscriptionModel } from "@/lib/modules/billing/subscription.model";
import { billingPlanModel } from "@/lib/modules/billing/billing-plan.model";
import { billingService } from "@/lib/modules/billing/billing.service";
import { billingContactModel } from "@/lib/modules/billing/billing-contact.model";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { chequeModel } from "@/lib/modules/records/cheque.model";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function manualStatus(periodStartIso: string, periodEndIso: string): "Active" | "Pending" | "Expired" {
  const start = new Date(periodStartIso);
  const end = new Date(periodEndIso);
  const now = new Date();
  if (now > end) return "Expired";
  if (now < start) return "Pending";
  return "Active";
}

function manualPlanName(durationMonths: number) {
  if (durationMonths >= 12) return "Manual Annual Plan";
  if (durationMonths >= 6) return "Manual Semi-Annual Plan";
  if (durationMonths >= 3) return "Manual Quarterly Plan";
  return "Manual Monthly Plan";
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) throw new Error("ClientId missing for user");
    const clientId = user.clientId;

    const client = await clientModel.findById(clientId);
    const contactSettings = await billingContactModel.get();

    // Hybrid metrics:
    // - scans from usage events
    // - mails + cheques from record tables
    const usage = await billingService.getUsageSummary(clientId);
    const scansUsed = Number(
      (usage as any)?.breakdown?.scan?.quantity ??
      (usage as any)?.breakdown?.envelope_scan?.quantity ??
      0
    );
    const [letters, packages, legal, cheques] = await Promise.all([
      mailItemModel.listByClient(clientId, { type: "letter", limit: 1 }),
      mailItemModel.listByClient(clientId, { type: "package", limit: 1 }),
      mailItemModel.listByClient(clientId, { type: "legal", limit: 1 }),
      chequeModel.listByClient(clientId, 1, 1),
    ]);
    const mailsReceived = Number(letters.total || 0) + Number(packages.total || 0) + Number(legal.total || 0);
    const chequesProcessed = Number(cheques.total || 0);

    // Default shape (filled below)
    const response = {
      planType: client.client_type === "manual" ? "manual" : "subscription",
      manual: {
        planName: "Enterprise (Manual)",
        status: "Active",
        notes: "Your plan is managed directly by your VScan Mail administrator.",
        startDate: "—",
        renewalDate: "—",
        assignedAdmin: "—",
        scansUsed,
        scansLimit: 0,
        mailsReceived,
        chequesProcessed,
      },
      subscription: {
        planLabel: "Subscription Plan",
        titleLine: "—",
        nextBillingDate: "—",
        scansUsed,
        scansLimit: 0,
        mailsReceived,
        chequesProcessed,
      },
      contactSettings,
    } as any;

    if (client.client_type === "manual") {
      const payments = await manualPaymentModel.listByClient(clientId);
      const latest = payments[0] || null;

      let assignedAdmin = "—";
      if (latest?.recorded_by) {
        const adminRows = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, latest.recorded_by))
          .limit(1);
        if (adminRows[0]) {
          const full = `${adminRows[0].firstName || ""} ${adminRows[0].lastName || ""}`.trim();
          assignedAdmin = full || adminRows[0].email || "—";
        }
      }

      if (latest) {
        const status = manualStatus(latest.period_start, latest.period_end);
        const start = formatDate(new Date(latest.period_start));
        const renewal = formatDate(new Date(latest.period_end));
        response.manual = {
          ...response.manual,
          planName: manualPlanName(latest.duration_months),
          status,
          notes: latest.notes || response.manual.notes,
          startDate: start,
          renewalDate: renewal,
          assignedAdmin,
          scansUsed,
          scansLimit: 0,
          mailsReceived,
          chequesProcessed,
        };
      } else {
        response.manual = {
          ...response.manual,
          assignedAdmin,
          scansUsed,
          mailsReceived,
          chequesProcessed,
        };
      }

      return NextResponse.json(response);
    }

    // Subscription customer
    const sub = await subscriptionModel.findByClient(clientId);
    if (sub) {
      const plan = await billingPlanModel.findById(sub.plan_tier).catch(() => null as any);
      const planName = plan?.name || sub.plan_tier;
      const price = plan?.price !== undefined ? `$${Number(plan.price)}` : "—";

      response.subscription = {
        ...response.subscription,
        planLabel: `${planName} Plan`,
        titleLine: `${planName} — ${price}/mo`,
        nextBillingDate: formatDate(new Date(sub.current_period_end)),
        scansUsed,
        scansLimit: plan?.max_scans ? Number(plan.max_scans) : 0,
        mailsReceived,
        chequesProcessed,
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

