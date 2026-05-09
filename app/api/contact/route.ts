import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/modules/core/middleware/rate-limit";
import { sendEmail } from "@/lib/modules/notifications/email.client";

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message must be under 2000 characters." }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ok = await rateLimit(`contact:${ip}`, 3, 60_000);
    if (!ok) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
    }

    const salesEmail = process.env.SALES_EMAIL || process.env.EMAIL_USER || "sales@vscanmail.com";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:24px 28px;">
          <h2 style="color:#fff;margin:0;font-size:20px;font-weight:700;">New Sales Enquiry</h2>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Submitted via VScanMail contact form</p>
        </div>
        <div style="padding:24px 28px;background:#fff;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600;width:110px;vertical-align:top;">Name</td>
              <td style="padding:10px 0;font-size:14px;color:#0f172a;font-weight:600;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600;vertical-align:top;border-top:1px solid #f1f5f9;">Email</td>
              <td style="padding:10px 0;font-size:14px;border-top:1px solid #f1f5f9;">
                <a href="mailto:${escapeHtml(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a>
              </td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600;vertical-align:top;border-top:1px solid #f1f5f9;">Company</td>
              <td style="padding:10px 0;font-size:14px;color:#0f172a;border-top:1px solid #f1f5f9;">${escapeHtml(company)}</td>
            </tr>` : ""}
          </table>
          <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 10px;">Message</p>
            <p style="color:#1e293b;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
          </div>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9;">
            <a href="mailto:${escapeHtml(email)}"
               style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;">
              Reply to ${escapeHtml(name)}
            </a>
          </div>
        </div>
        <div style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">VScanMail · vscanmail.com</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: salesEmail,
      subject: `VScanMail — Sales enquiry from ${name}${company ? ` (${company})` : ""}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[contact] send failed:", err);
    return NextResponse.json(
      { error: "Failed to send your message. Please try again." },
      { status: 500 }
    );
  }
}
