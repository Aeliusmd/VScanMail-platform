import { resend, EMAIL_FROM } from "./resend.config";
import { clientModel } from "../clients/client.model";
import { notificationPreferencesService } from "./notification-preferences.service";

/**
 * Wraps content in a professional, modern HTML email template
 */
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
    try {
      const html = wrapInTemplate(`
        <h1 style="font-size: 20px; color: #0f172a; margin-top: 0;">Verify your email</h1>
        <p style="color: #64748b; font-size: 15px;">Welcome to VScanMail. To complete your setup, please use the verification code below:</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: 800; color: #3b82f6; letter-spacing: 4px;">${otp}</span>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      `);

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "VScanMail — Verify your email",
        html,
      });

      if ((result as any)?.error) {
        const err = (result as any).error;
        throw new Error(err?.message || "Resend returned an error");
      }
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

    await resend.emails.send({
      from: EMAIL_FROM,
      to: client.email,
      subject: `VScanMail — New ${mailItem.type} received (${mailItem.irn})`,
      html,
    });
  },

  async sendTamperAlert(clientId: string, mailItem: any) {
    const client = await clientModel.findById(clientId);
    const html = wrapInTemplate(`
      <h1 style="font-size: 20px; color: #991b1b; margin-top: 0;">⚠️ Security Notice: Tamper Alert</h1>
      <p style="color: #64748b; font-size: 15px;">Our automated security audit has detected potential tampering on a document received for your organization.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <table class="detail-table">
          <tr>
            <td class="label">IRN</td>
            <td class="value" style="color: #991b1b;">${mailItem.irn}</td>
          </tr>
          <tr>
            <td class="label">Risk Level</td>
            <td class="value"><span class="status-badge" style="background-color: #fee2e2; color: #991b1b;">High Risk</span></td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0; color: #64748b; font-size: 14px;"><strong>Note:</strong> Suspicious alterations or envelope damage were detected during high-fidelity scanning.</p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mail/${mailItem.id}" class="button" style="background-color: #ef4444;">
          Review Immediately
        </a>
      </div>
    `);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: client.email,
      subject: `VScanMail — TAMPER ALERT — ${mailItem.irn}`,
      html,
    });
  },

  async sendChequeAlert(clientId: string, cheque: any, validation: any) {
    const prefs = await notificationPreferencesService.getForClient(clientId);
    if (!prefs.emailEnabled || !prefs.newChequeScanned) return;
    const client = await clientModel.findById(clientId);
    
    // Support both Cheque model and MailItem model keys
    const amount = cheque.cheque_amount_figures ?? cheque.amount_figures;
    const payee = cheque.cheque_beneficiary ?? cheque.beneficiary;
    const confidence = validation?.confidence !== undefined 
      ? validation.confidence 
      : (cheque.cheque_ai_confidence ?? 0.95);
    
    const status = validation?.status || cheque.cheque_status || 'validated';
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
            <td class="value">${payee || 'N/A'}</td>
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

    await resend.emails.send({
      from: EMAIL_FROM,
      to: client.email,
      subject: `VScanMail — Cheque ${statusLabel} ($${amount || '0.00'})`,
      html,
    });
  },
};
