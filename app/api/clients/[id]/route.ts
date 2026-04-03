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

    // Capture before state
    const beforeState = await clientModel.findById(id);

    const client = await clientModel.update(id, body);

    // Log the action
    await auditService.log({
      actor: user.id,
      actor_role: user.role,
      action: "client.updated",
      entity: id,
      before: beforeState,
      after: client,
      req,
    });

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

    // Capture before state
    const beforeState = await clientModel.findById(id);

    await clientModel.delete(id);

    // Log the action
    await auditService.log({
      actor: user.id,
      actor_role: user.role,
      action: "client.deleted",
      entity: id,
      before: beforeState,
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
