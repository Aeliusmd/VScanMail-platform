import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { chequeService } from "@/lib/modules/records/cheque.service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const formData = await req.formData();
    const mailItemId = formData.get("mailItemId") as string;
    const imageFile = formData.get("image") as File;

    if (!mailItemId || !imageFile) {
      return NextResponse.json(
        { error: "mailItemId and image are required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await chequeService.processAndValidate(mailItemId, base64, user.id, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
