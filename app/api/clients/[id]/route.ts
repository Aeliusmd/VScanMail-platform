import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { clientModel } from "@/lib/models/client.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);
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
    withRole(user, ["admin"]);
    const { id } = await params;
    const body = await req.json();
    const client = await clientModel.update(id, body);
    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
