import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { depositService } from "@/lib/modules/records/deposit.service";
import { bankAccountService } from "@/lib/modules/banking/bank-account.service";

function timeAgo(date: Date) {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const seconds = Math.abs(diffInSeconds);

  if (seconds < 45) return "Just now";

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "min", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return `${seconds} seconds ago`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);

    if (!user.clientId) {
      return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });
    }

    const clientId = user.clientId;

    // 1) Total mails — all record types (matches the mails page which shows all types)
    const [allMailsResponse, unreadMailsResponse] = await Promise.all([
      mailItemModel.listByClient(clientId, { limit: 1 }),
      mailItemModel.listByClient(clientId, { status: "received", limit: 1 }),
    ]);
    const totalMails = allMailsResponse.total;
    const unreadMails = unreadMailsResponse.total;

    // 2) Remaining independent queries — run in parallel
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      chequesResponse,
      pendingMails,
      pendingCheques,
      deposits,
      bankAccountsList,
    ] = await Promise.all([
      chequeModel.listByClient(clientId, 1, 1),
      mailItemModel.listByClient(clientId, { status: "action_required", limit: 1 }),
      chequeModel.listByClient(clientId, 1, 1, undefined, "flagged"),
      depositService.listMine({ clientId, from: monthStart.toISOString() }),
      bankAccountService.listForClient(clientId),
    ]);

    const totalCheques = chequesResponse.total;
    const pendingRequests = pendingMails.total + pendingCheques.total;
    const pendingChequesCount = pendingCheques.total;
    const totalDeposited = (deposits.deposits || [])
      .reduce((sum: number, d: any) => sum + Number(d.amountFigures || 0), 0);
    const bankAccounts = bankAccountsList.length;

    // 4) Recent activity
    const activityResponse = await mailItemModel.listByClient(clientId, { limit: 10 });
    const recentActivity = activityResponse.items
      .map((item: any) => {
        const isCheque = item.type === "cheque";
        return {
          id: isCheque ? `cheque-${item.id}` : `mail-${item.id}`,
          clientId: item.client_id,
          company: item.company_name || "Unknown Company",
          type: isCheque ? "Cheque" : "Mail",
          time: item.scanned_at ? timeAgo(new Date(item.scanned_at)) : "recently",
          status: isCheque ? mapChequeStatus(item.status) : mapMailStatus(item.status),
          statusColor: isCheque ? mapChequeColor(item.status) : mapMailColor(item.status),
          icon: isCheque ? "iconamoon:cheque" : "ri:mail-line",
        };
      })
      .slice(0, 5);

    return NextResponse.json({
      totalMails,
      unreadMails,
      totalCheques,
      pendingRequests,
      pendingCheques: pendingChequesCount,
      totalDeposited,
      bankAccounts,
      recentActivity,
    });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[API/Customer/Dashboard] Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch customer dashboard data" }, { status: 500 });
  }
}

function mapMailStatus(status: string) {
  switch (status) {
    case "scanned":
      return "Scanned";
    case "processed":
      return "Processed";
    case "delivered":
      return "Delivered";
    case "action_required":
      return "Pending";
    default:
      return status || "Unknown";
  }
}

function mapMailColor(status: string) {
  switch (status) {
    case "processed":
      return "bg-[#DBEAFE] text-[#1E40AF]";
    case "action_required":
      return "bg-yellow-100 text-yellow-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "scanned":
      return "bg-orange-100 text-orange-600";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function mapChequeStatus(status: string) {
  switch (status) {
    case "validated":
      return "Processed";
    case "flagged":
      return "Pending";
    case "deposited":
      return "Deposited";
    case "approved":
      return "Approved";
    default:
      return status || "Unknown";
  }
}

function mapChequeColor(status: string) {
  switch (status) {
    case "validated":
      return "bg-[#DBEAFE] text-[#1E40AF]";
    case "flagged":
      return "bg-yellow-100 text-yellow-700";
    case "deposited":
      return "bg-purple-100 text-purple-700";
    case "approved":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

