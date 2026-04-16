// ---- app/api/clients/route.ts ----
// Returns ALL companies from company_directory (self-registered + manually added).
// Used by: scan page forward dropdown, any feature needing a full company list.
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";
import { addManualCompanySchema } from "@/lib/modules/clients/client.schema";
import { generateClientCode, generateClientTableName } from "@/lib/modules/clients/client-code";
import { auditService } from "@/lib/modules/audit/audit.service";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100", 10);
    const result = await clientModel.list(page, limit);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      typeof err === "string"
        ? err
        : err instanceof Error
        ? err.message
        : "Unknown error while loading clients";
    console.error("GET /api/clients failed:", err);
    return NextResponse.json({ error: message }, { status: 400 });
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
      address_json: data.addressJson || { street: data.address || "", city: "", state: "", zip: "", country: "" } as any,
      client_type: "manual",
      status: (data.status?.toLowerCase() as any) || "pending",
      added_by: user.id,
      notes: data.notes || null,
    }, user.id, req);

    return NextResponse.json(
      { client: record },
      { status: 201 }
    );

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
