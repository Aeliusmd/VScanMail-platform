// ---- app/api/ai/summarize/route.ts ----
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { aiService } from "@/lib/modules/ai/ai.service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = await aiService.generateSummary(text);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ai.summarize] failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "AI summarization failed." }, { status: 500 });
  }
}
