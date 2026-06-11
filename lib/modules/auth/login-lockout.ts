import crypto from "crypto";
import { db, sql } from "@/lib/modules/core/db/mysql";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60_000;
const DB_PERSIST_TIMEOUT_MS = 2_000;
const SKIP_DB_PERSIST = process.env.NODE_ENV === "development";

type MemoryLockout = {
  failedCount: number;
  lockedUntil: number | null;
  updatedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __vscanmail_login_lockout_mem: Map<string, MemoryLockout> | undefined;
}

const memoryLockouts = globalThis.__vscanmail_login_lockout_mem ?? new Map();
globalThis.__vscanmail_login_lockout_mem = memoryLockouts;

let initPromise: Promise<void> | null = null;

function emailHash(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("login_lockout_db_timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
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

function statusFromMemory(hash: string, now: number): LoginLockoutStatus {
  const row = memoryLockouts.get(hash);
  if (!row) return { locked: false };

  if (row.lockedUntil && row.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((row.lockedUntil - now) / 1000)),
    };
  }

  if (row.lockedUntil && row.lockedUntil <= now) {
    memoryLockouts.set(hash, { failedCount: 0, lockedUntil: null, updatedAt: now });
  }

  return { locked: false };
}

function persistLockoutToDb(
  hash: string,
  failedCount: number,
  lockedUntil: number | null,
  now: number,
  deleteRow = false
): void {
  if (SKIP_DB_PERSIST) return;

  void (async () => {
    try {
      await withTimeout(ensureLoginLockoutTable(), DB_PERSIST_TIMEOUT_MS);
      if (deleteRow) {
        await withTimeout(
          db.execute(sql`DELETE FROM login_lockout WHERE email_hash = ${hash}`),
          DB_PERSIST_TIMEOUT_MS
        );
        return;
      }

      await withTimeout(
        db.execute(sql`
          INSERT INTO login_lockout (email_hash, failed_count, locked_until, updated_at)
          VALUES (${hash}, ${failedCount}, ${lockedUntil}, ${now})
          ON DUPLICATE KEY UPDATE
            failed_count = ${failedCount},
            locked_until = ${lockedUntil},
            updated_at = ${now}
        `),
        DB_PERSIST_TIMEOUT_MS
      );
    } catch {
      // Non-fatal — in-memory state is authoritative for this process.
    }
  })();
}

export type LoginLockoutStatus = {
  locked: boolean;
  retryAfterSeconds?: number;
};

export async function getLoginLockoutStatus(email: string): Promise<LoginLockoutStatus> {
  const hash = emailHash(email);
  const now = Date.now();
  return statusFromMemory(hash, now);
}

export async function recordLoginFailure(email: string): Promise<LoginLockoutStatus> {
  const hash = emailHash(email);
  const now = Date.now();

  const existing = statusFromMemory(hash, now);
  if (existing.locked) return existing;

  const prev = memoryLockouts.get(hash);
  const nextCount = (prev?.failedCount ?? 0) + 1;

  if (nextCount >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    memoryLockouts.set(hash, {
      failedCount: nextCount,
      lockedUntil,
      updatedAt: now,
    });
    persistLockoutToDb(hash, nextCount, lockedUntil, now);
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  memoryLockouts.set(hash, {
    failedCount: nextCount,
    lockedUntil: null,
    updatedAt: now,
  });
  persistLockoutToDb(hash, nextCount, null, now);

  return { locked: false };
}

export async function clearLoginLockout(email: string): Promise<void> {
  const hash = emailHash(email);
  memoryLockouts.delete(hash);
  persistLockoutToDb(hash, 0, null, Date.now(), true);
}

export function formatLoginLockoutMessage(retryAfterSeconds?: number): string {
  const seconds = retryAfterSeconds ?? Math.ceil(LOCKOUT_MS / 1000);
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many failed login attempts for this account. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
