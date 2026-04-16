import { getSmtpConfig, getTransporter } from "./smtp.config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

function buildFromHeader(): string {
  const cfg = getSmtpConfig();

  const emailFrom = process.env.EMAIL_FROM?.trim();
  if (emailFrom) return emailFrom;

  if (cfg.fromName) return `${cfg.fromName} <${cfg.user}>`;
  return cfg.user;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: input.from ?? buildFromHeader(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (process.env.NODE_ENV !== "test") {
      const to = Array.isArray(input.to) ? input.to.join(",") : input.to;
      console.log(`[email] sent subject="${input.subject}" to="${to}" id="${info.messageId}"`);
    }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "Unknown error";
    throw new Error(`Email delivery failed. ${message}`);
  }
}
