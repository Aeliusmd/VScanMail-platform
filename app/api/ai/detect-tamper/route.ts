import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { aiService } from "@/lib/modules/ai/ai.service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const formData = await req.formData();
    const frontFile = formData.get("front") as File;
    const backFile = formData.get("back") as File;

    if (!frontFile || !backFile) {
      return NextResponse.json(
        { error: "front and back images are required" },
        { status: 400 }
      );
    }

    const frontBase64 = Buffer.from(await frontFile.arrayBuffer()).toString("base64");
    const backBase64 = Buffer.from(await backFile.arrayBuffer()).toString("base64");

    const result = await aiService.detectTampering(frontBase64, backBase64);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
