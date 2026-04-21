import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { bankAccountService } from "@/lib/modules/banking/bank-account.service";
import { createBankAccountSchema } from "@/lib/modules/banking/bank-account.schema";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) {
      return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });
    }

    const ok = rateLimit(`customer:bank-accounts:list:${user.id}`, 120, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const accounts = await bankAccountService.listForClient(user.clientId);
    return NextResponse.json({ bankAccounts: accounts });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    const cause = (error as any)?.cause?.message;
    console.error("[API/Customer/BankAccounts] GET Error:", (error as Error)?.message ?? error, cause ?? "");
    return NextResponse.json({ error: "Failed to fetch bank accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["client"]);
    if (!user.clientId) {
      return NextResponse.json({ error: "ClientId missing for user" }, { status: 400 });
    }

    const ok = rateLimit(`customer:bank-accounts:create:${user.id}`, 20, 60_000);
    if (!ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const body = await req.json();
    const input = createBankAccountSchema.parse(body);
    const created = await bankAccountService.createForClient({
      actorId: user.id,
      actorRole: user.role as any,
      clientId: user.clientId,
      input,
      req,
    });

    return NextResponse.json({ bankAccount: created });
  } catch (error: any) {
    if (error instanceof Response) return error as any;
    if (error instanceof ZodError) {
      const msg = error.issues
        .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
        .join("; ");
      console.error("[API/Customer/BankAccounts] POST Error:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const msg = error?.message || "Failed to create bank account";
    const status = msg.includes("duplicate") ? 409 : 400;
    const cause = (error as any)?.cause?.message;
    console.error("[API/Customer/BankAccounts] POST Error:", msg, cause ?? "");
    return NextResponse.json({ error: msg }, { status });
  }
}

