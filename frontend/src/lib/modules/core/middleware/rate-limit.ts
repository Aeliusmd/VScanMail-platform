import crypto from "crypto";
import { db, sql } from "@/lib/modules/core/db/mysql";

/**
 * Database-backed rate limiter shared across server instances.
 * The table is created lazily so API routes can use this without a separate bootstrap step.
 */
let initPromise: Promise<void> | null = null;

async function ensureRateLimitTable() {
  if (!initPromise) {
    initPromise = db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        key_hash VARCHAR(64) NOT NULL PRIMARY KEY,
        count INT NOT NULL,
        reset_at BIGINT NOT NULL,
        KEY reset_at_idx (reset_at)
      )
    `)).then(() => undefined);
  }
  return initPromise;
}

export async function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): Promise<boolean> {
  await ensureRateLimitTable();

  const now = Date.now();
  const resetAt = now + windowMs;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  await db.execute(sql`
    INSERT INTO rate_limit_buckets (key_hash, count, reset_at)
    VALUES (${keyHash}, 1, ${resetAt})
    ON DUPLICATE KEY UPDATE
      count = IF(reset_at < ${now}, 1, count + 1),
      reset_at = IF(reset_at < ${now}, ${resetAt}, reset_at)
  `);

  const [rows] = (await db.execute(sql`
    SELECT count, reset_at FROM rate_limit_buckets WHERE key_hash = ${keyHash} LIMIT 1
  `)) as any;

  const row = rows?.[0];
  return Number(row?.count ?? 0) <= limit;
}
