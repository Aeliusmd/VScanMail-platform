import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/middleware/auth";
import { annotateSchema } from "@/lib/validators/mail.schema";
import { mailService } from "@/lib/services/mail.service";

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
