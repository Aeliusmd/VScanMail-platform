/**
 * Re-encrypts all client_bank_accounts rows from an old BANK_ENC_KEY_V1
 * to the current one in .env.local.
 *
 * Usage:
 *   OLD_BANK_ENC_KEY_V1="<your-old-base64-key>" npx tsx scripts/repair-bank-enc-keys.ts
 *
 * The current (new) key is read from BANK_ENC_KEY_V1 in .env.local as usual.
 * If OLD_BANK_ENC_KEY_V1 is not provided the script just runs a dry-run
 * decryption test with the current key and reports which rows fail.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import crypto from "crypto";

// ── inline crypto (avoids importing the module before env is loaded) ─────────
const IV_LEN = 12;
const TAG_LEN = 16;

function decodeKey(input: string, name: string): Buffer {
  const trimmed = input.trim();
  const b64 = Buffer.from(trimmed, "base64");
  if (b64.length === 32) return b64;
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    const hex = Buffer.from(trimmed, "hex");
    if (hex.length === 32) return hex;
  }
  throw new Error(`${name} must decode to 32 bytes. Got ${b64.length} bytes.`);
}

function tryDecrypt(payload: Buffer, key: Buffer, aad: string): string | null {
  try {
    if (payload.length < IV_LEN + TAG_LEN + 1) return null;
    const iv = payload.subarray(0, IV_LEN);
    const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = payload.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function encrypt(plaintext: string, key: Buffer, aad: string): Buffer {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]);
}
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const currentKeyRaw = process.env.BANK_ENC_KEY_V1;
  if (!currentKeyRaw) throw new Error("BANK_ENC_KEY_V1 not set in .env.local");

  const currentKey = decodeKey(currentKeyRaw, "BANK_ENC_KEY_V1");
  const oldKeyRaw = process.env.OLD_BANK_ENC_KEY_V1;
  const oldKey = oldKeyRaw ? decodeKey(oldKeyRaw, "OLD_BANK_ENC_KEY_V1") : null;
  const dryRun = !oldKey;

  if (dryRun) {
    console.log("⚠️  OLD_BANK_ENC_KEY_V1 not provided — running DRY-RUN with current key only.");
    console.log("    Rows that fail to decrypt will be reported.\n");
  } else {
    console.log("🔑 Old key loaded. Will re-encrypt rows that decrypt with old key.\n");
  }

  const { mysqlPool } = await import("../lib/modules/core/db/mysql");
  const [rows] = (await mysqlPool.execute(
    "SELECT id, client_id, account_number_enc, key_version FROM client_bank_accounts WHERE deleted_at IS NULL"
  )) as any;

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log("No active bank accounts found.");
    process.exit(0);
  }

  let ok = 0, failed = 0, reencrypted = 0;

  for (const row of rows) {
    const id: string = row.id;
    const clientId: string = row.client_id;
    const payload: Buffer = Buffer.isBuffer(row.account_number_enc)
      ? row.account_number_enc
      : Buffer.from(row.account_number_enc as any, "binary");
    const aad = `client:${clientId}`;

    // Try current key first
    const withCurrent = tryDecrypt(payload, currentKey, aad);
    if (withCurrent !== null) {
      ok++;
      console.log(`✅ ${id} — decrypts fine with current key`);
      continue;
    }

    // Current key failed
    if (!oldKey) {
      failed++;
      console.log(`❌ ${id} (client: ${clientId}) — FAILED with current key`);
      continue;
    }

    // Try old key
    const withOld = tryDecrypt(payload, oldKey, aad);
    if (withOld === null) {
      failed++;
      console.log(`❌ ${id} (client: ${clientId}) — failed with BOTH keys (data may be corrupt)`);
      continue;
    }

    // Re-encrypt with current key
    const newPayload = encrypt(withOld, currentKey, aad);
    await mysqlPool.execute(
      "UPDATE client_bank_accounts SET account_number_enc = ?, updated_at = NOW() WHERE id = ?",
      [newPayload, id]
    );
    reencrypted++;
    console.log(`🔄 ${id} — re-encrypted with new key`);
  }

  console.log(`\nDone. ✅ OK: ${ok}  🔄 Re-encrypted: ${reencrypted}  ❌ Failed: ${failed}`);

  if (failed > 0 && !oldKey) {
    console.log("\n💡 To fix the failed rows, run again with your old key:");
    console.log("   OLD_BANK_ENC_KEY_V1=\"<old-key>\" npx tsx scripts/repair-bank-enc-keys.ts");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
