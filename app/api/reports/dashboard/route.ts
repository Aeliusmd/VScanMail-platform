import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { chequeModel } from "@/lib/modules/records/cheque.model";
import { db } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { eq, count } from "drizzle-orm";

function timeAgo(date: Date) {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const seconds = Math.abs(diffInSeconds);
  
  if (seconds < 45) return "Just now";
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'min', seconds: 60 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
       // If it was a negative diff (timezone/clock drift), we still show it as "ago" 
       // but we've fixed the major timezone offset in the model.
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return `${seconds} seconds ago`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    // 1. Get total letters count (excluding cheques)
    const lettersResponse = await mailItemModel.listAllGlobal({ type: 'letter', limit: 1 });
    // Also consider other types that aren't cheques
    const pkgResponse = await mailItemModel.listAllGlobal({ type: 'package', limit: 1 });
    const totalMails = lettersResponse.total + pkgResponse.total;
    
    // 2. Get total cheques count
    const chequesResponse = await mailItemModel.listAllGlobal({ type: 'cheque', limit: 1 });
    const totalCheques = chequesResponse.total;

    // 3. Get total active companies
    const activeCompaniesRaw = await db
      .select({ value: count() })
      .from(clients)
      .where(eq(clients.status, "active"));
    const activeCompanies = activeCompaniesRaw[0]?.value || 0;

    // 4. Calculate Pending Requests (filtered by status)
    const pendingMails = await mailItemModel.listAllGlobal({ status: "action_required", limit: 1 });
    const pendingCheques = await mailItemModel.listAllGlobal({ status: "flagged", limit: 1 });
    const pendingRequests = pendingMails.total + pendingCheques.total;

    // 5. Get Combined Recent Activity (Fetch all together to avoid duplicates)
    const activityResponse = await mailItemModel.listAllGlobal({ limit: 10 });
    
    const recentActivity = activityResponse.items.map((item: any) => {
      const isCheque = item.type === 'cheque';
      return {
        id: isCheque ? `cheque-${item.id}` : `mail-${item.id}`,
        clientId: item.client_id,
        company: item.company_name || "Unknown Company",
        type: isCheque ? "Cheque" : "Mail",
        time: item.scanned_at ? timeAgo(new Date(item.scanned_at)) : "recently",
        status: isCheque ? mapChequeStatus(item.status) : mapMailStatus(item.status),
        statusColor: isCheque ? mapChequeColor(item.status) : mapMailColor(item.status),
        icon: isCheque ? "iconamoon:cheque" : "ri:mail-line"
      };
    }).slice(0, 5);

    return NextResponse.json({
      totalMails,
      totalCheques,
      activeCompanies,
      pendingRequests,
      recentActivity
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
