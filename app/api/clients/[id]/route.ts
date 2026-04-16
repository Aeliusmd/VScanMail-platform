import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";
import { auditService } from "@/lib/modules/audit/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);
    const { id } = await params;
    const client = await clientModel.findById(id);
    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);
    const { id } = await params;
    const body = await req.json();

    // client_type (plan type) must never be mutable from this endpoint.
    // Only subscription/billing flows should manage plan/type.
    if (body && typeof body === "object") {
      delete (body as any).clientType;
      delete (body as any).client_type;
      delete (body as any).client_type_id;
    }

    const client = await clientModel.update(id, body, user.id, req);

    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);
    const { id } = await params;

    await clientModel.delete(id, user.id, req);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
