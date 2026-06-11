import crypto from "crypto";
import { db, sql } from "@/lib/modules/core/db/mysql";

type MemoryBucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __vscanmail_rate_limit_mem: Map<string, MemoryBucket> | undefined;
}

const memoryBuckets = globalThis.__vscanmail_rate_limit_mem ?? new Map();
globalThis.__vscanmail_rate_limit_mem = memoryBuckets;

const DB_PERSIST_TIMEOUT_MS = 2_000;
const SKIP_DB_PERSIST = process.env.NODE_ENV === "development";

let initPromise: Promise<void> | null = null;

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/** Fast in-process limiter — never blocks on MySQL locks. */
function checkMemoryLimit(keyHash: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = memoryBuckets.get(keyHash);
  if (!existing || existing.resetAt < now) {
    memoryBuckets.set(keyHash, { count: 1, resetAt: now + windowMs });
    return true;
  }
  existing.count += 1;
  return existing.count <= limit;
}

async function ensureRateLimitTable() {
  if (!initPromise) {
    initPromise = db
      .execute(
        sql.raw(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        key_hash VARCHAR(64) NOT NULL PRIMARY KEY,
        count INT NOT NULL,
        reset_at BIGINT NOT NULL,
        KEY reset_at_idx (reset_at)
      )
    `)
      )
      .then(() => undefined);
  }
  return initPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("rate_limit_db_timeout")), ms);
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

/** Best-effort DB write for multi-instance consistency; never blocks the request path. */
function persistRateLimitToDb(keyHash: string, resetAt: number, now: number): void {
  if (SKIP_DB_PERSIST) return;

  void (async () => {
    try {
      await withTimeout(ensureRateLimitTable(), DB_PERSIST_TIMEOUT_MS);
      await withTimeout(
        db.execute(sql`
          INSERT INTO rate_limit_buckets (key_hash, count, reset_at)
          VALUES (${keyHash}, 1, ${resetAt})
          ON DUPLICATE KEY UPDATE
            count = IF(reset_at < ${now}, 1, count + 1),
            reset_at = IF(reset_at < ${now}, ${resetAt}, reset_at)
        `),
        DB_PERSIST_TIMEOUT_MS
      );
    } catch {
      // Non-fatal — in-memory limiter is authoritative for this process.
    }
  })();
}

/**
 * Rate limiter: in-memory hot path (O(1), no DB locks) with optional background DB persistence.
 */
export async function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): Promise<boolean> {
  const now = Date.now();
  const keyHash = hashKey(key);
  const resetAt = now + windowMs;
  const allowed = checkMemoryLimit(keyHash, limit, windowMs);
  persistRateLimitToDb(keyHash, resetAt, now);
  return allowed;
}
