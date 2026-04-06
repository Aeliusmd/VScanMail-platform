import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import { db } from "../core/db/mysql";
import { clients, profiles, users } from "../core/db/schema";
import { eq } from "drizzle-orm";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "operator" | "client";
  clientId?: string;
};

/**
 * Verify the session token from Authorization header.
 * Returns the authenticated user or throws 401.
 */
export async function withAuth(req: NextRequest): Promise<AuthUser> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let decoded: { sub: string; email: string };
  try {
    decoded = await verifyAccessToken(token);
  } catch {
    throw new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }

  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, decoded.sub))
    .limit(1);

  if (!userRows[0]) {
    throw new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }

  const profileRows = await db
    .select({ role: profiles.role, clientId: profiles.clientId })
    .from(profiles)
    .where(eq(profiles.userId, decoded.sub))
    .limit(1);

  const profile = profileRows[0];

  let role = (profile?.role as AuthUser["role"]) || "client";
  let clientId = profile?.clientId || undefined;

  // Company signups use clients.id === users.id. If profiles.client_id is missing
  // (migration / partial signup), still resolve client context for API + scan UI.
  if (!clientId) {
    const clientRows = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, userRows[0].id))
      .limit(1);
    if (clientRows[0]) clientId = clientRows[0].id;
  }

  return {
    id: userRows[0].id,
    email: userRows[0].email,
    role,
    clientId,
  };
}

/**
 * Check if user has one of the allowed roles.
 * Throws 403 if not.
 */
export function withRole(user: AuthUser, allowed: string[]) {
  if (!allowed.includes(user.role)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }
}
