import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/modules/auth/auth.middleware";
import { clientModel } from "@/lib/modules/clients/client.model";
import { db } from "@/lib/modules/core/db/mysql";
import { users } from "@/lib/modules/core/db/schema";

export const dynamic = "force-dynamic";

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

    if (!client.avatar_url) {
      const [userRow] = await db
        .select({ avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      if (userRow?.avatarUrl) {
        (client as any).avatar_url = userRow.avatarUrl;
      }
    }

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

