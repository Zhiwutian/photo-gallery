import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function getKeyMaterial(): string {
  const explicit = process.env.REFRESH_TOKEN_ENCRYPTION_KEY?.trim();
  if (explicit) {
    return explicit;
  }
  const fallback = process.env.SESSION_SECRET?.trim();
  if (fallback) {
    return fallback;
  }
  throw new Error(
    "Set REFRESH_TOKEN_ENCRYPTION_KEY (preferred) or SESSION_SECRET for refresh token encryption.",
  );
}

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(getKeyMaterial()).digest();
}

export function encryptSecret(secretValue: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secretValue, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${ciphertext.toString("base64url")}.${tag.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  const [ivEncoded, ciphertextEncoded, tagEncoded] = value.split(".");
  if (!ivEncoded || !ciphertextEncoded || !tagEncoded) {
    throw new Error("Invalid encrypted payload format");
  }
  const decipher = crypto.createDecipheriv(
    ALGO,
    deriveKey(),
    Buffer.from(ivEncoded, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
