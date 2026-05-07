/**
 * Deletes all rows in client_bank_accounts that cannot be decrypted with
 * the current BANK_ENC_KEY_V1. Run this when the encryption key has changed
 * and the old key is not available.
 *
 * After running, clients must re-add their bank accounts via the UI.
 *
 * Usage:  npx tsx scripts/reset-bank-accounts.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const { mysqlPool } = await import("../lib/modules/core/db/mysql");

  const [result] = (await mysqlPool.execute(
    "DELETE FROM client_bank_accounts"
  )) as any;

  console.log(`✅ Deleted ${result.affectedRows} bank account row(s).`);
  console.log("   Clients must re-add their bank accounts via Account Settings → Bank Accounts.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
