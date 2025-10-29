import crypto from "crypto";

const secretKey = process.env.CRYPTO_SECRET_KEY;

if (!secretKey || secretKey.length !== 64) {
  console.warn(
    "⚠️ Using temporary secret key for development. Set CRYPTO_SECRET_KEY in .env for production."
  );
}

export class CryptoService {
  static encrypt(text) {
    try {
      if (!text) return text;

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(secretKey, "hex"),
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
  }

  static decrypt(encryptedText) {
    try {
      if (!encryptedText) return encryptedText;

      const parts = encryptedText.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted text format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], "hex");

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(secretKey, "hex"),
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Decryption failed");
    }
  }

  static maskCardNumber(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) return "****";
    return "**** **** **** " + cardNumber.slice(-4);
  }

  static maskCVV(cvv) {
    return "***";
  }

  static maskAadhar(aadhar) {
    if (!aadhar || aadhar.length !== 12) return "**** **** ****";
    return aadhar.slice(0, 4) + " **** " + aadhar.slice(-4);
  }

  static maskPAN(pan) {
    if (!pan || pan.length !== 10) return "*****";
    return pan.slice(0, 2) + "****" + pan.slice(-4);
  }

  static maskPhone(phone) {
    if (!phone || phone.length < 4) return "****";
    return "******" + phone.slice(-4);
  }

  static maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) return "****";
    return "****" + accountNumber.slice(-4);
  }

  static hashData(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }
}