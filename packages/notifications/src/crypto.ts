import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:";
const PREFIX_V1 = "v1:enc:";

/**
 * Encrypts text using AES-256-GCM
 * Format: v1:enc:iv:tag:encrypted
 */
export function encrypt(text: string | null | undefined): string | null | undefined {
  if (!text || text.startsWith(PREFIX) || text.startsWith(PREFIX_V1)) return text;

  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  // Ensure key is 32 bytes (64 hex characters)
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 characters)");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return `${PREFIX_V1}${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypts text using AES-256-GCM
 * Supports both legacy (enc:) and versioned (v1:enc:) formats
 */
export function decrypt(text: string | null | undefined): string | null | undefined {
  if (!text) return text;

  let partString = "";
  if (text.startsWith(PREFIX_V1)) {
    partString = text.slice(PREFIX_V1.length);
  } else if (text.startsWith(PREFIX)) {
    partString = text.slice(PREFIX.length);
  } else {
    return text;
  }

  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 characters)");
  }

  try {
    const parts = partString.split(":");
    if (parts.length !== 3) return text;

    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted as any, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[CRYPTO_DECRYPT_ERROR]", error);
    // Return original text if decryption fails
    return text;
  }
}
