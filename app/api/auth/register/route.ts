// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/modules/auth/auth.schema";
import { authService } from "@/lib/modules/auth/auth.service";

import { auditService } from "@/lib/modules/audit/audit.service";

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();

    const captchaToken = body?.captchaToken;
    if (!captchaToken || typeof captchaToken !== "string") {
      return NextResponse.json({ error: "CAPTCHA verification required." }, { status: 400 });
    }
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
    }

    const input = registerSchema.parse(body);
    const result = await authService.register(input, req);

    return NextResponse.json(result, { status: 201 });


  } catch (error: any) {
    console.error("Registration error:", error);
    const errorMsg = error?.message || "";
    const causeMsg = error?.cause?.message || "";
    const causeCode = error?.cause?.code || error?.code || "";

    if (causeCode === "ER_BAD_FIELD_ERROR") {
      return NextResponse.json(
        {
          error:
            "Registration failed due to a database schema mismatch. Please run database migrations and try again.",
        },
        { status: 500 }
      );
    }

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
