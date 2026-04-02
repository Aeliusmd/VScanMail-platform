// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/modules/auth/auth.schema";
import { authService } from "@/lib/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);
    const result = await authService.register(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    const errorMsg = error?.message || "";
    const causeMsg = error?.cause?.message || "";
    const causeCode = error?.cause?.code || error?.code || "";

    if (
      errorMsg.includes("ER_DUP_ENTRY") || 
      errorMsg.includes("users_email_uq") ||
      causeMsg.includes("ER_DUP_ENTRY") ||
      causeMsg.includes("users_email_uq") ||
      causeCode === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }
    if (errorMsg.toLowerCase().includes("insert into") || errorMsg.toLowerCase().includes("sql") || causeMsg.toLowerCase().includes("insert into")) {
      return NextResponse.json({ error: "A database error occurred during registration. Please try again." }, { status: 500 });
    }
    return NextResponse.json(
      { error: errorMsg || "Registration failed" },
      { status: 400 }
    );
  }
}
