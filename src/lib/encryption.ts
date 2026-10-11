import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PREFIX = "enc:v1:";

/**
 * Derives a deterministic 32-byte key from environment secret
 */
function getEncryptionKey(): Buffer {
  const masterSecret =
    process.env.ENCRYPTION_SECRET ||
    process.env.SUPER_ADMIN_PASSWORD;

  if (!masterSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: ENCRYPTION_SECRET environment variable is not set in production!"
      );
    }
    // Development fallback
    return crypto.scryptSync("mogent-dev-secret-key-fallback-only", "mogent_dev_salt_2026", 32);
  }

  const salt = process.env.ENCRYPTION_SALT || "mogent_salt_2026";
  return crypto.scryptSync(masterSecret, salt, 32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Stored format: enc:v1:<ivHex>:<authTagHex>:<cipherHex>
 */
export function encryptSecret(plainText: string | null | undefined): string | null {
  if (!plainText || typeof plainText !== "string" || plainText.trim() === "") {
    return null;
  }

  // If already encrypted, avoid double-encrypting
  if (plainText.startsWith(PREFIX)) {
    return plainText;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("[SECURITY] Encryption failed:", error);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Data encryption failed. Aborting to protect secret confidentiality.");
    }
    return plainText;
  }
}

/**
 * Decrypts an AES-256-GCM ciphertext.
 * Gracefully handles unencrypted legacy text.
 */
export function decryptSecret(cipherText: string | null | undefined): string {
  if (!cipherText || typeof cipherText !== "string") {
    return "";
  }

  // Backward compatibility: if not encrypted with our prefix, return as-is
  if (!cipherText.startsWith(PREFIX)) {
    return cipherText;
  }

  try {
    const raw = cipherText.slice(PREFIX.length);
    const parts = raw.split(":");
    if (parts.length !== 3) {
      return cipherText;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[SECURITY] Decryption failed, returning masked text:", error);
    return "";
  }
}

/**
 * Returns a masked representation for secure UI display (e.g. ••••••••abcd)
 */
export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return "";
  const plain = decryptSecret(secret);
  if (!plain || plain.length <= 4) {
    return "••••••••";
  }
  return "••••••••" + plain.slice(-4);
}
