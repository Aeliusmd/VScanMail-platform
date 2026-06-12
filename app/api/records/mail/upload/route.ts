import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { quotaService } from "@/lib/modules/billing/quota.service";
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

    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    for (const file of [frontFile, backFile, ...contentFiles]) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.type}. Accepted: jpeg, png, webp, pdf.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 20 MB.` },
          { status: 400 }
        );
      }
    }

    // Quota check — deny if client has exceeded their monthly scan limit
    const quota = await quotaService.checkScanAllowed(clientId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason, used: quota.used, limit: quota.limit },
        { status: 402 }
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
      contentBuffers,
      req
    );


    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[records.mail.upload] failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Mail upload failed." }, { status: 500 });
  }
}
