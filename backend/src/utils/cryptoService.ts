import crypto from "crypto";

const algorithm = "aes-256-gcm";

const secretKey = process.env.CRYPTO_SECRET_KEY;

if (!secretKey || secretKey.length !== 64) {
  console.warn(
    "⚠️ Using temporary secret key for development. Set CRYPTO_SECRET_KEY in .env for production."
  );
}

export class CryptoService {
  static encrypt = (text: string): string => {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(secretKey as string, "hex"),
        iv
      );

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return (
        iv.toString("hex") + ":" + encrypted + ":" + authTag.toString("hex")
      );
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Encryption failed");
    }
  };

  static decrypt = (encryptedText: string): string => {
    try {
      const parts = encryptedText.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted text format");
      }

      const iv = Buffer.from(parts[0] as string, "hex");
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2] as string, "hex");

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(secretKey as string, "hex"),
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted as string, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Decryption failed");
    }
  };
}
