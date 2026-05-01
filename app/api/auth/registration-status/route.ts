import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/modules/core/db/mysql";
import { clients, profiles, users } from "@/lib/modules/core/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const emailRaw = req.nextUrl.searchParams.get("email");
    const email = z.string().email().parse(emailRaw);

    const userRows = await db
      .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = userRows[0];
    if (!user) {
      return NextResponse.json({ emailVerified: false, clientPending: false });
    }

    const profileRows = await db
      .select({ clientId: profiles.clientId })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    const clientId = profileRows[0]?.clientId;
    if (!clientId) {
      return NextResponse.json({
        emailVerified: !!user.emailVerifiedAt,
        clientPending: false,
      });
    }

    const clientRows = await db
      .select({ status: clients.status })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    const status = clientRows[0]?.status;

    return NextResponse.json({
      emailVerified: !!user.emailVerifiedAt,
      clientPending: status === "pending",
    });
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
}
