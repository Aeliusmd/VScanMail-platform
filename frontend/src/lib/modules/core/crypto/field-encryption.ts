import crypto from "crypto";

export type KeyVersion = 1;

export type KeyProvider = {
  getEncryptionKey(version: KeyVersion): Buffer;
  getHmacKey(version: KeyVersion): Buffer;
  currentVersion(): KeyVersion;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function decodeKeyMaterial(input: string, expectedBytes: number, name: string): Buffer {
  // Prefer base64 (recommended). Fall back to hex for convenience.
  const trimmed = input.trim();
  const base64Buf = Buffer.from(trimmed, "base64");
  if (base64Buf.length === expectedBytes) return base64Buf;

  const hexLike = /^[0-9a-fA-F]+$/.test(trimmed);
  if (hexLike) {
    const hexBuf = Buffer.from(trimmed, "hex");
    if (hexBuf.length === expectedBytes) return hexBuf;
  }

  throw new Error(
    `${name} must be ${expectedBytes} bytes (base64 recommended). Got ${base64Buf.length} bytes from base64 decode.`
  );
}

export function envKeyProvider(): KeyProvider {
  return {
    getEncryptionKey(version: KeyVersion) {
      if (version !== 1) throw new Error(`Unsupported key version: ${version}`);
      return decodeKeyMaterial(requireEnv("BANK_ENC_KEY_V1"), 32, "BANK_ENC_KEY_V1");
    },
    getHmacKey(version: KeyVersion) {
      if (version !== 1) throw new Error(`Unsupported key version: ${version}`);
      return decodeKeyMaterial(requireEnv("BANK_ENC_HMAC_KEY_V1"), 32, "BANK_ENC_HMAC_KEY_V1");
    },
    currentVersion() {
      const raw = process.env.BANK_ENC_CURRENT_VERSION;
      if (!raw) return 1;
      const n = Number(raw);
      if (n !== 1) throw new Error(`Unsupported BANK_ENC_CURRENT_VERSION: ${raw}`);
      return 1;
    },
  };
}

export type EncryptedField = {
  keyVersion: KeyVersion;
  payload: Buffer; // iv(12) | tag(16) | ciphertext
};

const IV_LEN = 12;
const TAG_LEN = 16;

export function encryptField(
  plaintext: string,
  opts?: { aad?: string; keyProvider?: KeyProvider }
): EncryptedField {
  const keyProvider = opts?.keyProvider ?? envKeyProvider();
  const keyVersion = keyProvider.currentVersion();
  const encKey = keyProvider.getEncryptionKey(keyVersion);

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey, iv);
  if (opts?.aad) cipher.setAAD(Buffer.from(opts.aad, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return { keyVersion, payload: Buffer.concat([iv, tag, ciphertext]) };
}

export function decryptField(
  input: EncryptedField,
  opts?: { aad?: string; keyProvider?: KeyProvider }
): string {
  const keyProvider = opts?.keyProvider ?? envKeyProvider();
  const encKey = keyProvider.getEncryptionKey(input.keyVersion);
  const payload = input.payload;

  if (payload.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = payload.subarray(IV_LEN + TAG_LEN);

  const decipher = crypto.createDecipheriv("aes-256-gcm", encKey, iv);
  if (opts?.aad) decipher.setAAD(Buffer.from(opts.aad, "utf8"));
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function hmacSha256Hex(
  plaintext: string,
  opts?: { keyVersion?: KeyVersion; keyProvider?: KeyProvider }
): { keyVersion: KeyVersion; hex: string } {
  const keyProvider = opts?.keyProvider ?? envKeyProvider();
  const keyVersion = opts?.keyVersion ?? keyProvider.currentVersion();
  const hmacKey = keyProvider.getHmacKey(keyVersion);

  const h = crypto.createHmac("sha256", hmacKey);
  h.update(Buffer.from(plaintext, "utf8"));
  return { keyVersion, hex: h.digest("hex") };
}

