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
    process.env.SUPER_ADMIN_PASSWORD ||
    "mogent_production_master_secret_key_2026";

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
    return plainText;
  }
}

/**
 * Decrypts an AES-256-GCM ciphertext.
 * Gracefully handles unencrypted legacy text and environment migrations.
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
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    // Primary attempt using active environment key
    try {
      const key = getEncryptionKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      // Primary key failed (e.g. environment secret changed), attempt fallback candidates
    }

    const candidateSecrets = [
      process.env.ENCRYPTION_SECRET,
      process.env.SUPER_ADMIN_PASSWORD,
      "mogent_production_master_secret_key_2026",
      "mogent-dev-secret-key-fallback-only",
      "admin123456",
    ].filter(Boolean) as string[];

    const candidateSalts = [
      process.env.ENCRYPTION_SALT || "mogent_salt_2026",
      "mogent_salt_2026",
      "mogent_dev_salt_2026",
    ];

    for (const secret of candidateSecrets) {
      for (const salt of candidateSalts) {
        try {
          const fallbackKey = crypto.scryptSync(secret, salt, 32);
          const decipher = crypto.createDecipheriv(ALGORITHM, fallbackKey, iv);
          decipher.setAuthTag(authTag);
          let dec = decipher.update(encryptedHex, "hex", "utf8");
          dec += decipher.final("utf8");
          if (dec) return dec;
        } catch {
          // Continue to next candidate
        }
      }
    }

    console.warn("[SECURITY] Decryption failed across all candidate keys. Value may need to be re-entered in Super Admin.");
    return "";
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
