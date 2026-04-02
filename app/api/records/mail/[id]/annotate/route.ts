import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { annotateSchema } from "@/lib/modules/records/mail.schema";
import { mailService } from "@/lib/modules/records/mail.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    withRole(user, ["operator", "admin"]);

    const { id } = await params;
    const body = await req.json();
    const input = annotateSchema.parse(body);

    const result = await mailService.saveAnnotations(
      id,
      user.id,
      input.annotations,
      input.tamperDetected,
      input.tamperNotes
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
