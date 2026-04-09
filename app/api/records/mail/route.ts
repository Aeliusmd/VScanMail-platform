// ---- app/api/mail/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { mailQuerySchema } from "@/lib/modules/records/mail.schema";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client", "admin", "super_admin"]);

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = mailQuerySchema.parse(params);

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    let result;
    if (isAdmin && !params.clientId) {
      result = await mailItemModel.listAllGlobal(query);
    } else {
      const clientId = isAdmin ? params.clientId : user.clientId!;
      result = await mailItemModel.listByClient(clientId, query);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    // Pass through Response objects thrown by auth middleware (401/403)
    if (error instanceof Response) {
      return error as any;
    }
    // Zod validation errors are 400 (Bad Request)
    if (error instanceof ZodError) {
      console.error("[API/Records/Mail] Validation Error:", error.errors);
      return NextResponse.json({ error: "Invalid query parameters", details: error.errors }, { status: 400 });
    }
    // All other errors are server-side — return 500
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API/Records/Mail] Server Error:", msg, error?.stack);
    return NextResponse.json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Server Error: ${msg}` 
        : "An internal server error occurred.",
      code: error?.code,
    }, { status: 500 });
  }
}
