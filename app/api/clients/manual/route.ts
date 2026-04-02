import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";
import { addManualCompanySchema } from "@/lib/modules/clients/client.schema";
import { generateClientCode, generateClientTableName } from "@/lib/modules/clients/client-code";
import { createClientTable } from "@/lib/modules/core/db/dynamic-table";

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
    id: record.id,
    directoryId: record.id,
    name: record.company_name,
    initial: record.company_name.charAt(0).toUpperCase(),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    industry: record.industry,
    industryBadge: INDUSTRY_COLORS[record.industry] ?? "bg-slate-100 text-slate-700",
    contact: record.contact || "N/A",
    email: record.email,
    phone: record.phone || "N/A",
    address: record.address_json?.street || "N/A",
    website: record.website || "",
    status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
    mails: 0,
    cheques: 0,
    chequeValue: 0,
    notes: record.notes || "No notes added.",
    joined: new Date(record.created_at).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }),
    time: "Just now",
    lastActivity: "Just now",
    paymentType: "other",
    subscriptionPlan: "none",
    subscriptionAmount: 0,
    subscriptionStatus: record.status || "pending",
    isManuallyAdded: record.client_type === "manual",
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "operator", "super_admin"]);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    const result = await clientModel.list(page, limit, "manual");

    return NextResponse.json({
      companies: result.clients.map((c, i) => toFrontendCompany(c, i)),
      total: result.total,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const body = await req.json();
    const data = addManualCompanySchema.parse(body);

    const existing = await clientModel.findByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        { error: "A company with this email already exists." },
        { status: 409 }
      );
    }

    const clientCode = generateClientCode();
    const tableName = generateClientTableName(clientCode);
    
    // Create new manual client
    const record = await clientModel.create({
      id: crypto.randomUUID(),
      client_code: clientCode,
      table_name: tableName,
      company_name: data.companyName,
      industry: data.industry,
      email: data.email,
      phone: data.phone || "",
      address_json: { street: data.address || "", city: "", state: "", zip: "", country: "" },
      client_type: "manual",
      status: (data.status as any) || "active",
      added_by: user.id,
      notes: data.notes || null,
    });

    // Native setup
    try {
      await createClientTable(tableName);
    } catch (e) {
      console.warn("Failed creating dynamic table", e);
    }

    return NextResponse.json(
      { company: toFrontendCompany(record, 0) },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
