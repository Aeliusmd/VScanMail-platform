import { sendEmail } from "./email.client";
import { clientModel } from "../clients/client.model";
import { notificationPreferencesService } from "./notification-preferences.service";

function escapeHtml(s: string | null | undefined): string {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatScanDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return escapeHtml(String(iso));
    return escapeHtml(
      d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    );
  } catch {
    return escapeHtml(String(iso));
  }
}

function truncatePlain(s: string | null | undefined, max: number): string {
  if (!s) return "";
  const t = String(s).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function tamperRiskBadgeStyle(
  level: string | undefined
): { bg: string; color: string; label: string } {
  const l = (level || "high").toLowerCase();
  const map: Record<string, { bg: string; color: string; label: string }> = {
    none: { bg: "#f1f5f9", color: "#475569", label: "None" },
    low: { bg: "#dcfce7", color: "#166534", label: "Low" },
    medium: { bg: "#fef9c3", color: "#854d0e", label: "Medium" },
    high: { bg: "#fee2e2", color: "#991b1b", label: "High" },
    critical: { bg: "#fecaca", color: "#7f1d1d", label: "Critical" },
  };
  return map[l] || map.high;
}

function buildTamperFindingsHtml(annotations: any): string {
  const findings = annotations?.findings;
  if (!Array.isArray(findings) || findings.length === 0) {
    return `<p style="margin:0;color:#64748b;font-size:14px;line-height:1.5;">No detailed line-item findings were returned for this scan. Use the <strong>system recommendation</strong> below and open the envelope record in VScanMail for full images and notes.</p>`;
  }
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${findings
        .slice(0, 8)
        .map((f: any, i: number) => {
          const type = escapeHtml(f?.type || "Finding");
          const desc = escapeHtml(f?.description || "—");
          const loc = escapeHtml(f?.location || "—");
          const conf =
            typeof f?.confidence === "number"
              ? `${Math.round(Math.min(1, Math.max(0, f.confidence)) * 100)}%`
              : "—";
          return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #fecaca;vertical-align:top;width:36px;color:#b91c1c;font-weight:800;font-size:14px;">${i + 1}</td>
          <td style="padding:14px 0;border-bottom:1px solid #fecaca;">
            <div style="font-weight:700;color:#0f172a;font-size:14px;">${type}</div>
            <div style="font-size:13px;color:#475569;margin-top:6px;line-height:1.45;">${desc}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Location: ${loc} · Signal confidence: ${conf}</div>
          </td>
        </tr>`;
        })
        .join("")}
    </table>
    ${findings.length > 8 ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Showing 8 of ${findings.length} findings. Open the dashboard for the full list.</p>` : ""}
  `;
}

function wrapInTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VScanMail Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 0; }
        .wrapper { background-color: #f1f5f9; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 24px 32px; }
        .logo { font-size: 22px; font-weight: 800; color: #3b82f6; text-decoration: none; letter-spacing: -0.025em; }
        .body { padding: 32px; }
        .footer { padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
        .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; }
        .highlight-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .detail-table tr:last-child td { border-bottom: none; }
        .label { color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em; }
        .value { color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <a href="https://vscanmail.com" class="logo">VScanMail</a>
          </div>
          <div class="body">
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VScanMail. All rights reserved.</p>
            <p>123 Security Blvd, Suite 100, Tech City</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const notificationService = {
  async sendVerificationEmail(email: string, otp: string) {
    const html = wrapInTemplate(`
      <h1 style="font-size: 20px; color: #0f172a; margin-top: 0;">Verify your email</h1>
      <p style="color: #64748b; font-size: 15px;">Welcome to VScanMail. To complete your setup, please use the verification code below:</p>
      
      <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: 800; color: #3b82f6; letter-spacing: 4px;">${otp}</span>
      </div>
      
      <p style="color: #64748b; font-size: 13px; text-align: center;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
    `);

    try {
      await sendEmail({
        to: email,
        subject: "VScanMail — Verify your email",
        html,
      });
    } catch (err: any) {
      throw new Error(`Failed to send verification email. ${err?.message}`);
    }
  },

  async sendNewMailAlert(clientId: string, mailItem: any) {
    const prefs = await notificationPreferencesService.getForClient(clientId);
    if (!prefs.emailEnabled || !prefs.newMailScanned) return;

    const client = await clientModel.findById(clientId);

    const html = wrapInTemplate(`
      <h1 style="font-size: 20px; color: #0f172a; margin-top: 0;">New Mail Received</h1>
      <p style="color: #64748b; font-size: 15px;">We've received and scanned a new document for your organization.</p>
      
      <div class="highlight-box">
        <table class="detail-table">
          <tr>
            <td class="label">IRN</td>
            <td class="value">${mailItem.irn}</td>
          </tr>
          <tr>
            <td class="label">Document Type</td>
            <td class="value" style="text-transform: capitalize;">${mailItem.type}</td>
          </tr>
        </table>
      </div>

      ${mailItem.ai_summary ? `
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; color: #1d4ed8; font-size: 13px; font-weight: 700; text-transform: uppercase;">AI Summary</p>
          <p style="margin: 0; color: #1e40af; font-size: 14px; font-style: italic;">"${mailItem.ai_summary}"</p>
        </div>
      ` : ""}

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mail/${mailItem.id}" class="button">
          View Document
        </a>
      </div>
    `);

    await sendEmail({
      to: client.email,
      subject: `VScanMail — New ${mailItem.type} received (${mailItem.irn})`,
      html,
    });
  },

  async sendTamperAlert(clientId: string, mailItem: any) {
    const client = await clientModel.findById(clientId);
    const ann = mailItem?.tamper_annotations;
    const riskFromModel =
      typeof ann?.risk_level === "string" ? ann.risk_level : mailItem?.ai_risk_level;
    const badge = tamperRiskBadgeStyle(riskFromModel);
    const modelConfidence =
      typeof ann?.confidence === "number"
        ? `${Math.round(Math.min(1, Math.max(0, ann.confidence)) * 100)}%`
        : "—";
    const recommendation = ann?.recommendation
      ? escapeHtml(String(ann.recommendation))
      : "";
    const summaryExcerpt = mailItem?.ai_summary
      ? escapeHtml(truncatePlain(mailItem.ai_summary, 420))
      : "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const mailUrl = `${appUrl}/dashboard/mail/${mailItem.id}`;

    const html = wrapInTemplate(`
      <div style="background:linear-gradient(135deg,#fef2f2 0%,#fff7ed 50%,#ffffff 100%);border-radius:12px;padding:20px 20px 8px;margin:-8px -8px 0 -8px;border:1px solid #fecaca;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#b91c1c;">Security · Envelope integrity</p>
        <h1 style="font-size:22px;color:#7f1d1d;margin:0 0 10px;line-height:1.25;">Possible tampering detected on a scanned envelope</h1>
        <p style="margin:0;color:#64748b;font-size:15px;line-height:1.55;">VScanMail’s automated envelope review flagged <strong style="color:#0f172a;">physical or seal anomalies</strong> (e.g. resealing, tape, tears, or unusual marks). Please review the record in your dashboard and decide next steps.</p>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Organization</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(client.company_name)}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Notification sent to <strong style="color:#334155;">${escapeHtml(client.email)}</strong></p>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">Document snapshot</p>
        <table class="detail-table">
          <tr>
            <td class="label">IRN</td>
            <td class="value" style="color:#0f172a;font-family:ui-monospace,monospace;">${escapeHtml(mailItem.irn)}</td>
          </tr>
          <tr>
            <td class="label">Type</td>
            <td class="value" style="text-transform:capitalize;">${escapeHtml(mailItem.type || "—")}</td>
          </tr>
          <tr>
            <td class="label">Workflow status</td>
            <td class="value" style="text-transform:capitalize;">${escapeHtml(mailItem.status || "—")}</td>
          </tr>
          <tr>
            <td class="label">Scanned at</td>
            <td class="value">${formatScanDate(mailItem.scanned_at)}</td>
          </tr>
          <tr>
            <td class="label">Record ID</td>
            <td class="value" style="font-size:12px;font-family:ui-monospace,monospace;word-break:break-all;">${escapeHtml(mailItem.id)}</td>
          </tr>
        </table>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px 22px;margin:0 0 20px;">
        <table class="detail-table" style="margin-bottom:12px;">
          <tr>
            <td class="label" style="color:#991b1b;">Assessment</td>
            <td class="value"><span class="status-badge" style="background-color:${badge.bg};color:${badge.color};">${badge.label} risk</span></td>
          </tr>
          <tr>
            <td class="label">Model confidence</td>
            <td class="value">${modelConfidence}</td>
          </tr>
          <tr>
            <td class="label">Content risk (AI)</td>
            <td class="value" style="text-transform:capitalize;">${escapeHtml(mailItem.ai_risk_level || "—")}</td>
          </tr>
        </table>
        ${recommendation ? `<p style="margin:0;font-size:14px;color:#334155;line-height:1.55;"><strong style="color:#0f172a;">Recommendation:</strong> ${recommendation}</p>` : `<p style="margin:0;font-size:14px;color:#64748b;">Open the envelope in VScanMail to review front/back images and any operator notes.</p>`}
      </div>

      <div style="margin:0 0 20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">What we look for</p>
        <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.6;">
          <li>Torn or damaged flap / seal</li>
          <li>Resealing (glue, wrinkles at the seal)</li>
          <li>Tape or adhesive marks</li>
          <li>Staining, water damage, or heavy creasing</li>
          <li>Signs consistent with steaming or opening</li>
        </ul>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#b45309;">Detected findings</p>
        ${buildTamperFindingsHtml(ann)}
      </div>

      ${summaryExcerpt ? `
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 18px;margin:0 0 20px;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#1d4ed8;">Letter / content summary (if available)</p>
        <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.5;">“${summaryExcerpt}”</p>
      </div>
      ` : ""}

      <div style="background:#f1f5f9;border-radius:10px;padding:16px 18px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0f172a;">Suggested next steps</p>
        <ol style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.55;">
          <li>Open the envelope record and compare <strong>front vs. back</strong> images.</li>
          <li>Confirm whether the finding matches your chain of custody or expected handling.</li>
          <li>Escalate per your internal policy if this is a regulated or high-value item.</li>
        </ol>
      </div>

      <div style="text-align:center;margin-top:8px;">
        <a href="${mailUrl}" class="button" style="background-color:#dc2626;">Review envelope in VScanMail</a>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">If the button does not work, copy and paste this link into your browser:<br /><span style="color:#64748b;word-break:break-all;">${escapeHtml(mailUrl)}</span></p>
      </div>
    `);

    const plain = [
      `VScanMail — Possible tampering detected`,
      ``,
      `Organization: ${client.company_name}`,
      `IRN: ${mailItem.irn}`,
      `Type: ${mailItem.type || "—"} · Status: ${mailItem.status || "—"}`,
      `Scanned: ${mailItem.scanned_at ? new Date(mailItem.scanned_at).toISOString() : "—"}`,
      `Record: ${mailItem.id}`,
      ``,
      `Risk: ${badge.label} (model) · Model confidence: ${modelConfidence}`,
      ann?.recommendation ? `Recommendation: ${truncatePlain(String(ann.recommendation), 600)}` : "",
      ``,
      `Open: ${mailUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendEmail({
      to: client.email,
      subject: `VScanMail — Security alert: review envelope (${mailItem.irn})`,
      html,
      text: plain,
    });
  },

  async sendChequeAlert(clientId: string, cheque: any, validation: any) {
    const prefs = await notificationPreferencesService.getForClient(clientId);
    if (!prefs.emailEnabled || !prefs.newChequeScanned) return;

    const client = await clientModel.findById(clientId);

    const amount = cheque.cheque_amount_figures ?? cheque.amount_figures;
    const payee = cheque.cheque_beneficiary ?? cheque.beneficiary;
    const confidence =
      validation?.confidence !== undefined ? validation.confidence : cheque.cheque_ai_confidence ?? 0.95;

    const status = validation?.status || cheque.cheque_status || "validated";
    const isValidated = status === "validated";
    const statusLabel = isValidated ? "Ready for Review" : "Flagged — Attention Required";
    const statusColor = isValidated ? "#166534" : "#991b1b";
    const statusBg = isValidated ? "#dcfce7" : "#fee2e2";

    const html = wrapInTemplate(`
      <h1 style="font-size: 20px; color: #0f172a; margin-top: 0;">Cheque Processing Complete</h1>
      <p style="color: #64748b; font-size: 15px;">A new cheque has been ingested and verified by VScan AI. It is now awaiting your final approval.</p>
      
      <div class="highlight-box">
        <table class="detail-table">
          <tr>
            <td class="label">Amount</td>
            <td class="value" style="font-size: 18px;">$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="label">Payee</td>
            <td class="value">${payee || "N/A"}</td>
          </tr>
          <tr>
            <td class="label">Security Status</td>
            <td class="value">
              <span class="status-badge" style="background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}44;">
                ${statusLabel}
              </span>
            </td>
          </tr>
          <tr>
            <td class="label">AI Confidence</td>
            <td class="value">${Math.round(confidence * 100)}%</td>
          </tr>
        </table>
      </div>

      ${!isValidated ? `
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 12px; margin-bottom: 24px; color: #9a3412; font-size: 13px;">
          <strong>Warning:</strong> Some 6-point validation checks did not pass automatically. Manual inspection is highly recommended.
        </div>
      ` : ""}

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cheques/${cheque.id}" class="button">
          Open Approval Portal
        </a>
      </div>
    `);

    await sendEmail({
      to: client.email,
      subject: `VScanMail — Cheque ${statusLabel} ($${amount || "0.00"})`,
      html,
    });
  },

  async sendBankAccountChangeAlert(
    clientId: string,
    payload: {
      kind: "added" | "removed";
      bankName: string;
      nickname: string;
      accountLast4: string;
    }
  ) {
    const prefs = await notificationPreferencesService.getForClient(clientId);
    // Use existing depositUpdates flag as the closest matching preference.
    if (!prefs.emailEnabled || !prefs.depositUpdates) return;

    const client = await clientModel.findById(clientId);

    const verb = payload.kind === "added" ? "added" : "removed";
    const title =
      payload.kind === "added"
        ? "Bank account added"
        : "Bank account removed";

    const html = wrapInTemplate(`
      <h1 style="font-size: 20px; color: #0f172a; margin-top: 0;">${title}</h1>
      <p style="color: #64748b; font-size: 15px;">
        A bank account was <strong style="color:#0f172a;">${verb}</strong> for your organization.
        For security, we only show the last 4 digits.
      </p>

      <div class="highlight-box">
        <table class="detail-table">
          <tr>
            <td class="label">Nickname</td>
            <td class="value">${escapeHtml(payload.nickname)}</td>
          </tr>
          <tr>
            <td class="label">Bank</td>
            <td class="value">${escapeHtml(payload.bankName)}</td>
          </tr>
          <tr>
            <td class="label">Account</td>
            <td class="value">•••• ${escapeHtml(payload.accountLast4)}</td>
          </tr>
        </table>
      </div>

      <p style="color:#64748b;font-size:13px;margin:0;">
        If you did not perform this change, please contact support immediately.
      </p>
    `);

    await sendEmail({
      to: client.email,
      subject: `VScanMail — ${title}`,
      html,
    });
  },
};
