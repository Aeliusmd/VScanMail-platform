import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients, profiles, users } from "@/lib/modules/core/db/schema";
import { desc, eq } from "drizzle-orm";
import { depositModel } from "@/lib/modules/records/deposit.model";
import { deliveryModel } from "@/lib/modules/records/delivery.model";

function startOfThisMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function depositStatusLabel(d: any): string {
  if (d?.markedDepositedAt) return "Deposited";
  if (d?.decision === "rejected") return "Rejected";
  if (d?.decision === "approved") return "Approved";
  if (d?.slipUploadedAt) return "Slip Uploaded";
  return "Open";
}

function deliveryStatusLabel(s: string | null): string {
  if (!s) return "Pending";
  if (s === "in_transit") return "On the Way";
  return s.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function GET(req: NextRequest) {
  try {
    const actor = await withAuth(req);
    withRole(actor, ["super_admin"]);

    const monthStart = startOfThisMonthUtc();

    const [{ totalOrgs }] = await db
      .select({ totalOrgs: sql<number>`count(*)` })
      .from(clients);

    const [{ orgsThisMonth }] = await db
      .select({ orgsThisMonth: sql<number>`count(*)` })
      .from(clients)
      .where(sql`${clients.createdAt} >= ${monthStart}`);

    const adminRows = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        lastLoginAt: users.lastLoginAt,
        isActive: users.isActive,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(profiles.role, "admin"))
      .orderBy(desc(users.lastLoginAt), desc(users.createdAt))
      .limit(10);

    const now = Date.now();
    const onlineCutoffMs = 30 * 60 * 1000;
    const admins = adminRows.map((r) => {
      const name =
        [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.email;
      const last = r.lastLoginAt ? new Date(r.lastLoginAt as any).toISOString() : null;
      const isOnline = Boolean(r.isActive) && Boolean(last) && now - new Date(last!).getTime() <= onlineCutoffMs;
      return {
        id: r.userId,
        name,
        email: r.email,
        avatarUrl: r.avatarUrl ?? null,
        lastLoginAt: last,
        isOnline,
      };
    });

    const activeAdmins = adminRows.filter((a) => Boolean(a.isActive)).length;
    const onlineAdmins = admins.filter((a) => a.isOnline).length;

    // Pending/open counts across dynamic client tables (fast aggregate SQL).
    const allClientTables = await db.select({ tableName: clients.tableName }).from(clients);
    const [tablesResult] = await db.execute(sql`SHOW TABLES`);
    const existingTableNames = new Set(((tablesResult as unknown) as any[]).map((row) => Object.values(row)[0] as string));
    const tableNames = allClientTables.map((r) => r.tableName).filter((t) => existingTableNames.has(t));

    const openDepositUnion = tableNames
      .map(
        (t) =>
          `SELECT COUNT(*) AS c FROM \`${t}\`
           WHERE record_type = 'cheque'
             AND deposit_requested_at IS NOT NULL
             AND (deposit_decision IS NULL OR deposit_decision = '')`
      )
      .join(" UNION ALL ");
    const openDepositTodayUnion = tableNames
      .map(
        (t) =>
          `SELECT COUNT(*) AS c FROM \`${t}\`
           WHERE record_type = 'cheque'
             AND deposit_requested_at IS NOT NULL
             AND (deposit_decision IS NULL OR deposit_decision = '')
             AND DATE(deposit_requested_at) = CURDATE()`
      )
      .join(" UNION ALL ");

    const pendingDeliveryUnion = tableNames
      .map(
        (t) =>
          `SELECT COUNT(*) AS c FROM \`${t}\`
           WHERE delivery_requested_at IS NOT NULL
             AND (delivery_status = 'pending' OR delivery_status IS NULL)`
      )
      .join(" UNION ALL ");
    const pendingDeliveryTodayUnion = tableNames
      .map(
        (t) =>
          `SELECT COUNT(*) AS c FROM \`${t}\`
           WHERE delivery_requested_at IS NOT NULL
             AND (delivery_status = 'pending' OR delivery_status IS NULL)
             AND DATE(delivery_requested_at) = CURDATE()`
      )
      .join(" UNION ALL ");

    const sumCounts = async (unionSql: string): Promise<number> => {
      if (!unionSql) return 0;
      const [rows] = (await db.execute(sql.raw(`SELECT SUM(c) AS total FROM (${unionSql}) q`))) as any;
      return Number(rows?.[0]?.total || 0);
    };

    const [openDeposits, openDepositsToday, pendingDeliveries, pendingDeliveriesToday] = await Promise.all([
      sumCounts(openDepositUnion),
      sumCounts(openDepositTodayUnion),
      sumCounts(pendingDeliveryUnion),
      sumCounts(pendingDeliveryTodayUnion),
    ]);

    const [depositsRes, deliveriesRes] = await Promise.all([
      depositModel.listAllForAdmin({ limit: 30 }),
      deliveryModel.listAllForAdmin({ limit: 30 }),
    ]);

    const deposits = (depositsRes.deposits || []).map((d) => ({
      id: d.chequeId,
      clientName: d.clientName ?? "Organization",
      type: "Deposit" as const,
      amount: Number(d.amountFigures || 0),
      status: depositStatusLabel(d),
      requestedAt: d.requestedAt,
    }));

    const deliveries = (deliveriesRes.deliveries || []).map((d) => ({
      id: d.id,
      clientName: d.clientName ?? "Organization",
      type: "Delivery" as const,
      amount: d.amountFigures ?? null,
      status: deliveryStatusLabel(d.status),
      requestedAt: d.requestedAt,
    }));

    const recentRequests = [...deposits, ...deliveries]
      .filter((r) => r.requestedAt)
      .sort((a, b) => new Date(b.requestedAt as string).getTime() - new Date(a.requestedAt as string).getTime())
      .slice(0, 12);

    const recentOrgs = await db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        clientType: clients.clientType,
        status: clients.status,
        tableName: clients.tableName,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .orderBy(desc(clients.updatedAt))
      .limit(6);

    const recentOrganizations = await Promise.all(
      recentOrgs.map(async (c) => {
        let recordCount: number | null = null;
        if (existingTableNames.has(c.tableName)) {
          try {
            const [rows] = (await db.execute(
              sql.raw(`SELECT COUNT(*) AS c FROM \`${c.tableName}\``)
            )) as any;
            recordCount = Number(rows?.[0]?.c || 0);
          } catch {
            recordCount = null;
          }
        }
        return {
          id: c.id,
          name: c.companyName,
          plan: c.clientType === "subscription" ? "Subscription" : "Manual",
          joined: c.createdAt ? new Date(c.createdAt as any).toISOString() : null,
          status: c.status,
          records: recordCount,
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalOrganizations: Number(totalOrgs || 0),
        organizationsThisMonth: Number(orgsThisMonth || 0),
        activeAdmins,
        onlineAdmins,
        openDeposits,
        openDepositsToday,
        pendingDeliveries,
        pendingDeliveriesToday,
      },
      recentRequests,
      admins,
      recentOrganizations,
    });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    return NextResponse.json({ error: error.message || "Failed to load dashboard" }, { status: 400 });
  }
}

