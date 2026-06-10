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
}
