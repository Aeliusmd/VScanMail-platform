import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailService } from "@/lib/modules/records/mail.service";

export const maxDuration = 60; // Vercel Pro: allow 60s for AI processing

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const formData = await req.formData();
    const clientId = formData.get("clientId") as string;
    const type = formData.get("type") as string;

    const frontFile = formData.get("front") as File;
    const backFile = formData.get("back") as File;
    const contentFiles: File[] = formData.getAll("content") as File[];

    if (!frontFile || !backFile || !clientId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: front, back, clientId, type" },
        { status: 400 }
      );
    }

    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());
    const backBuffer = Buffer.from(await backFile.arrayBuffer());
    const contentBuffers = await Promise.all(
      contentFiles.map(async (f) => Buffer.from(await f.arrayBuffer()))
    );

    const result = await mailService.uploadAndProcess(
      clientId,
      user.id,
      type,
      frontBuffer,
      backBuffer,
      contentBuffers
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
