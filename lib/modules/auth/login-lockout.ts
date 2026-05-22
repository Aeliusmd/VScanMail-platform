import crypto from "crypto";
import { db, sql } from "@/lib/modules/core/db/mysql";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60_000;

let initPromise: Promise<void> | null = null;

function emailHash(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

async function ensureLoginLockoutTable() {
  if (!initPromise) {
    initPromise = db
      .execute(
        sql.raw(`
      CREATE TABLE IF NOT EXISTS login_lockout (
        email_hash VARCHAR(64) NOT NULL PRIMARY KEY,
        failed_count INT NOT NULL DEFAULT 0,
        locked_until BIGINT NULL,
        updated_at BIGINT NOT NULL
      )
    `)
      )
      .then(() => undefined);
  }
  return initPromise;
}

export type LoginLockoutStatus = {
  locked: boolean;
  retryAfterSeconds?: number;
};

export async function getLoginLockoutStatus(email: string): Promise<LoginLockoutStatus> {
  await ensureLoginLockoutTable();

  const hash = emailHash(email);
  const now = Date.now();

  const [rows] = (await db.execute(sql`
    SELECT failed_count, locked_until FROM login_lockout WHERE email_hash = ${hash} LIMIT 1
  `)) as any;

  const row = rows?.[0];
  if (!row) return { locked: false };

  const lockedUntil = row.locked_until != null ? Number(row.locked_until) : null;

  if (lockedUntil && lockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
    };
  }

  if (lockedUntil && lockedUntil <= now) {
    await db.execute(sql`
      UPDATE login_lockout
      SET failed_count = 0, locked_until = NULL, updated_at = ${now}
      WHERE email_hash = ${hash}
    `);
  }

  return { locked: false };
}

export async function recordLoginFailure(email: string): Promise<LoginLockoutStatus> {
  await ensureLoginLockoutTable();

  const existing = await getLoginLockoutStatus(email);
  if (existing.locked) return existing;

  const hash = emailHash(email);
  const now = Date.now();

  const [rows] = (await db.execute(sql`
    SELECT failed_count FROM login_lockout WHERE email_hash = ${hash} LIMIT 1
  `)) as any;

  const nextCount = Number(rows?.[0]?.failed_count ?? 0) + 1;

  if (nextCount >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    await db.execute(sql`
      INSERT INTO login_lockout (email_hash, failed_count, locked_until, updated_at)
      VALUES (${hash}, ${nextCount}, ${lockedUntil}, ${now})
      ON DUPLICATE KEY UPDATE
        failed_count = ${nextCount},
        locked_until = ${lockedUntil},
        updated_at = ${now}
    `);
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  await db.execute(sql`
    INSERT INTO login_lockout (email_hash, failed_count, locked_until, updated_at)
    VALUES (${hash}, ${nextCount}, NULL, ${now})
    ON DUPLICATE KEY UPDATE
      failed_count = ${nextCount},
      locked_until = NULL,
      updated_at = ${now}
  `);

  return { locked: false };
}

export async function clearLoginLockout(email: string): Promise<void> {
  await ensureLoginLockoutTable();
  const hash = emailHash(email);
  await db.execute(sql`DELETE FROM login_lockout WHERE email_hash = ${hash}`);
}

export function formatLoginLockoutMessage(retryAfterSeconds?: number): string {
  const seconds = retryAfterSeconds ?? Math.ceil(LOCKOUT_MS / 1000);
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many failed login attempts for this account. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
