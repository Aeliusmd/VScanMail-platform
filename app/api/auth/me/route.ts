import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import { clientModel } from "@/lib/models/client.model";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);

    if (!user.clientId) {
      return NextResponse.json({
        user: { id: user.id, email: user.email },
        role: user.role,
        clientId: null,
        client: null,
      });
    }

    const client = await clientModel.findById(user.clientId);

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      role: user.role,
      clientId: user.clientId,
      client,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load auth info" },
      { status: 400 }
    );
  }
}

