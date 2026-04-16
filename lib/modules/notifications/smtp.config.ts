import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function parsePort(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBool(raw: string | undefined): boolean | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  if (/^(true|1|yes|y)$/i.test(v)) return true;
  if (/^(false|0|no|n)$/i.test(v)) return false;
  return undefined;
}

export function getSmtpConfig(): SmtpConfig {
  const host = optionalEnv("SMTP_HOST") ?? "smtp.gmail.com";
  const port = parsePort(optionalEnv("SMTP_PORT")) ?? 465;
  const secure = parseBool(optionalEnv("SMTP_SECURE")) ?? true;

  const user = requiredEnv("EMAIL_USER");
  const pass = requiredEnv("EMAIL_PASS");
  const fromName = optionalEnv("FROM_NAME");

  return { host, port, secure, user, pass, fromName };
}

let cachedTransporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const cfg = getSmtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  return cachedTransporter;
}

