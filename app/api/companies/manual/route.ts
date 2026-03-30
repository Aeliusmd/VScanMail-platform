import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { manualClientModel } from "@/lib/models/manual-client.model";
import { addManualCompanySchema } from "@/lib/validators/company.schema";
import { companyDirectoryModel } from "@/lib/models/company-directory.model";

const INDUSTRY_COLORS: Record<string, string> = {
  Technology: "bg-blue-100 text-blue-700",
  Finance: "bg-green-100 text-green-700",
  Healthcare: "bg-teal-100 text-teal-700",
  Manufacturing: "bg-orange-100 text-orange-700",
  Consulting: "bg-cyan-100 text-cyan-700",
  Investment: "bg-amber-100 text-amber-700",
  "Real Estate": "bg-rose-100 text-rose-700",
  Logistics: "bg-indigo-100 text-indigo-700",
  Legal: "bg-purple-100 text-purple-700",
  Retail: "bg-pink-100 text-pink-700",
};

const AVATAR_COLORS = [
  "bg-[#0A3D8F]",
  "bg-[#2F8F3A]",
  "bg-[#D97706]",
  "bg-[#0D9488]",
  "bg-[#E11D48]",
  "bg-[#334155]",
];

function toFrontendCompany(record: any, index = 0) {
  return {
    id: record.id,          // manually_added_clients.id — used for subscription PATCH
    directoryId: record.directoryId,
    name: record.companyName,
    initial: record.companyName.charAt(0).toUpperCase(),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    industry: record.industry,
    industryBadge: INDUSTRY_COLORS[record.industry] ?? "bg-slate-100 text-slate-700",
    contact: record.contactPerson || "N/A",
    email: record.email,
    phone: record.phone || "N/A",
    address: record.addressText || "N/A",
    website: record.website || "",
    status: record.status.charAt(0).toUpperCase() + record.status.slice(1) as "Active" | "Pending" | "Inactive",
    mails: 0,
    cheques: 0,
    chequeValue: 0,
    notes: record.notes || "No notes added.",
    joined: new Date(record.createdAt).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }),
    time: "Just now",
    lastActivity: "Just now",
    paymentType: record.paymentType,
    subscriptionPlan: record.subscriptionPlan,
    subscriptionAmount: record.subscriptionAmount,
    subscriptionStatus: record.subscriptionStatus,
    isManuallyAdded: true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "operator"]);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    const result = await manualClientModel.list(page, limit);

    return NextResponse.json({
      companies: result.companies.map((c, i) => toFrontendCompany(c, i)),
      total: result.total,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const body = await req.json();
    const data = addManualCompanySchema.parse(body);

    // Check for duplicate email in company_directory
    const existing = await companyDirectoryModel.findByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        { error: "A company with this email already exists." },
        { status: 409 }
      );
    }

    const record = await manualClientModel.create(user.id, data);

    return NextResponse.json(
      { company: toFrontendCompany(record, 0) },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
