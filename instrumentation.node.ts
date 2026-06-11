export function registerNodeHandlers() {
  const g = globalThis as unknown as { __vscanmail_handlers__?: boolean };
  if (g.__vscanmail_handlers__) return;
  g.__vscanmail_handlers__ = true;

  process.on("unhandledRejection", (reason) => {
    console.error(
      `[${new Date().toISOString()}] unhandledRejection:`,
      reason instanceof Error ? reason.stack || reason.message : reason
    );
  });

  process.on("uncaughtException", (err) => {
    // Log and keep running. PM2 remains the backstop if the process truly dies.
    console.error(
      `[${new Date().toISOString()}] uncaughtException:`,
      (err as Error)?.stack || (err as Error)?.message || err
    );
  });

  process.on("warning", (warning) => {
    console.warn(`[${new Date().toISOString()}] processWarning:`, warning?.message || warning);
  });

  // Pre-warm the MySQL connection pool so the first login request doesn't
  // time out waiting for a cold remote DB connection. Also create the lazy
  // DDL tables (login_lockout, rate_limit_buckets) that would otherwise be
  // created on the first request to those routes.
  setImmediate(() => {
    import("./lib/modules/core/db/mysql")
      .then(({ db, sql }) =>
        db.execute(sql`SELECT 1`).then(async () => {
          await db.execute(sql.raw(`
            CREATE TABLE IF NOT EXISTS login_lockout (
              email_hash VARCHAR(64) NOT NULL PRIMARY KEY,
              failed_count INT NOT NULL DEFAULT 0,
              locked_until BIGINT NULL,
              updated_at BIGINT NOT NULL
            )
          `));
          await db.execute(sql.raw(`
            CREATE TABLE IF NOT EXISTS rate_limit_buckets (
              key_hash VARCHAR(64) NOT NULL PRIMARY KEY,
              count INT NOT NULL,
              reset_at BIGINT NOT NULL,
              KEY reset_at_idx (reset_at)
            )
          `));
          console.log(`[${new Date().toISOString()}] DB pool warmed up`);
        })
      )
      .catch((err: unknown) => {
        console.warn(
          `[${new Date().toISOString()}] DB warm-up failed (non-fatal):`,
          err instanceof Error ? err.message : err
        );
      });
  });
}
