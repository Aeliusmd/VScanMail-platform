import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { depositService } from "@/lib/modules/records/deposit.service";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await depositService.uploadSlip({
      chequeId: id,
      actorId: user.id,
      actorRole: user.role as any,
      fileName: file.name || "slip.jpg",
      fileBuffer: buffer,
      fileContentType: file.type || "image/jpeg",
      req,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

