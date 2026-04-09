import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { db } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { eq, count } from "drizzle-orm";

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    // 1. Get recent mails and total mail count
    const mailsResponse = await mailItemModel.listAllGlobal({ limit: 5 });
    
    // 2. Get recent cheques and total cheque count
    const chequesResponse = await chequeModel.listAllGlobal({ limit: 5 });

    // 3. Get total active companies
    const activeCompaniesRaw = await db
      .select({ value: count() })
      .from(clients)
      .where(eq(clients.status, "active"));
    const activeCompanies = activeCompaniesRaw[0]?.value || 0;

    // 4. Calculate Pending Requests (Mails pending action + Cheques pending action)
    // We didn't do specific filtered counts to keep it fast, but for an estimate we'll query pending explicitly
    const pendingMails = await mailItemModel.listAllGlobal({ status: "action_required", limit: 1 });
    const pendingCheques = await chequeModel.listAllGlobal({ status: "flagged", limit: 1 });
    const pendingRequests = pendingMails.total + pendingCheques.total;

    // 5. Combine and format Recent Activity
    const recentMails = mailsResponse.items.map((mail: any) => ({
      id: `mail-${mail.id}`,
      company: mail.company_name || "Unknown Company",
      type: "Mail",
      time: mail.scanned_at ? timeAgo(new Date(mail.scanned_at)) : "recently",
      dateVal: new Date(mail.scanned_at || mail.created_at).getTime(),
      status: mapMailStatus(mail.status),
      statusColor: mapMailColor(mail.status),
      icon: "ri:mail-line"
    }));

    const recentCheques = chequesResponse.cheques.map((cheque: any) => ({
      id: `cheque-${cheque.id}`,
      company: cheque.company_name || "Unknown Company",
      type: "Cheque",
      time: cheque.created_at ? timeAgo(new Date(cheque.created_at)) : "recently",
      dateVal: new Date(cheque.created_at).getTime(),
      status: mapChequeStatus(cheque.status),
      statusColor: mapChequeColor(cheque.status),
      icon: "iconamoon:cheque"
    }));

    const combinedActivities = [...recentMails, ...recentCheques]
      .sort((a, b) => b.dateVal - a.dateVal)
      .slice(0, 5)
      .map(({ dateVal, ...rest }) => rest);

    return NextResponse.json({
      totalMails: mailsResponse.total,
      totalCheques: chequesResponse.total,
      activeCompanies,
      pendingRequests,
      recentActivity: combinedActivities
    });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    console.error("[API/Reports/Dashboard] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

// Helpers for UI mapping
function mapMailStatus(status: string) {
  switch (status) {
    case "scanned": return "Scanned";
    case "processed": return "Processed";
    case "delivered": return "Delivered";
    case "action_required": return "Pending";
    default: return status || "Unknown";
  }
}

function mapMailColor(status: string) {
  switch (status) {
    case "processed": return "bg-[#DBEAFE] text-[#1E40AF]"; // Blue
    case "action_required": return "bg-yellow-100 text-yellow-700"; // Yellow
    case "delivered": return "bg-green-100 text-green-700"; // Green
    case "scanned": return "bg-orange-100 text-orange-600"; // Orange
    case "pending": return "bg-yellow-100 text-yellow-700"; 
    default: return "bg-gray-100 text-gray-700";
  }
}

function mapChequeStatus(status: string) {
  switch (status) {
    case "validated": return "Processed";
    case "flagged": return "Pending";
    case "deposited": return "Deposited";
    case "approved": return "Approved";
    default: return status || "Unknown";
  }
}

function mapChequeColor(status: string) {
  switch (status) {
    case "validated": return "bg-[#DBEAFE] text-[#1E40AF]";
    case "flagged": return "bg-yellow-100 text-yellow-700";
    case "deposited": return "bg-purple-100 text-purple-700"; // Purple
    case "approved": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
}
