import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);
const configuredFrom = process.env.EMAIL_FROM || "noreply@vscanmail.com";

// Resend only allows sending from verified domains/senders.
// Many people set a personal Gmail here, which will not work unless verified.
const looksLikePersonalMailbox =
  /@(?:gmail|yahoo|outlook|hotmail)\.com\s*>?$/i.test(configuredFrom.trim());

export const EMAIL_FROM =
  process.env.NODE_ENV !== "production" && looksLikePersonalMailbox
    ? "VScanMail <onboarding@resend.dev>"
    : configuredFrom;
