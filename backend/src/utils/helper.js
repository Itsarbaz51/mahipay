import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import { Decimal } from "@prisma/client/runtime/library";

class Helper {
  static generateAccessToken(payload) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      jwtid: uuidv4(),
    };
    return jwt.sign(payload, secret, options);
  }

  static generateRefreshToken(payload) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      jwtid: uuidv4(),
    };
    return jwt.sign(payload, secret, options);
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  }

  static serializeUser(user) {
    if (!user) return user;

    const serialized = { ...user };

    if (user.wallets) {
      serialized.wallets = user.wallets.map((wallet) => ({
        ...wallet,
        // Convert BigInt balances to rupees
        balance: this.convertBigIntToRupees(wallet.balance),
        holdBalance: this.convertBigIntToRupees(wallet.holdBalance),
        availableBalance: this.convertBigIntToRupees(wallet.availableBalance),
        dailyLimit: this.convertBigIntToRupees(wallet.dailyLimit),
        monthlyLimit: this.convertBigIntToRupees(wallet.monthlyLimit),
        perTransactionLimit: this.convertBigIntToRupees(
          wallet.perTransactionLimit
        ),
      }));
    }

    if (user.bankInfo?.primaryAccount) {
      serialized.bankInfo.primaryAccount = {
        ...user.bankInfo.primaryAccount,
      };
    }

    if (user.kycInfo?.latestKyc?.dob) {
      serialized.kycInfo.latestKyc.dob =
        user.kycInfo.latestKyc.dob.toISOString();
    }

    if (user.kycInfo?.latestKyc?.createdAt) {
      serialized.kycInfo.latestKyc.createdAt =
        user.kycInfo.latestKyc.createdAt.toISOString();
    }

    if (user.kycInfo?.latestKyc?.updatedAt) {
      serialized.kycInfo.latestKyc.updatedAt =
        user.kycInfo.latestKyc.updatedAt.toISOString();
    }

    return serialized;
  }

  static convertBigIntToRupees(value) {
    if (!value) return "0.00";

    const bigIntValue = BigInt(value);
    const rupees = bigIntValue / 100n;
    const paise = bigIntValue % 100n;

    return `${rupees}.${paise.toString().padStart(2, "0")}`;
  }

  static serializeCommission(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.serializeCommissionItem(item));
    }
    return this.serializeCommissionItem(data);
  }

  static serializeCommissionItem(item) {
    if (!item) return item;

    const serialized = { ...item };

    const bigIntFields = [
      "amount",
      "commissionAmount",
      "tdsAmount",
      "gstAmount",
      "netAmount",
      "minAmount",
      "maxAmount",
      "balance",
      "holdBalance",
      "availableBalance",
    ];

    bigIntFields.forEach((field) => {
      if (serialized[field] !== undefined && serialized[field] !== null) {
        serialized[field] = Number(serialized[field]);
      }
    });

    // Convert Decimal to Number
    const decimalFields = ["commissionValue", "tdsPercent", "gstPercent"];
    decimalFields.forEach((field) => {
      if (serialized[field] !== undefined && serialized[field] !== null) {
        serialized[field] = Number(serialized[field]);
      }
    });

    return serialized;
  }

  static async sendEmail({ to, subject, text, html }) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    return transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });
  }

  static async getGeoLocation(ip) {
    try {
      if (!ip) return {};

      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      const data = response.data;

      if (data.status === "success") {
        const location = `${data.city}, ${data.regionName}, ${data.country}`;
        return {
          location,
          latitude: data.lat,
          longitude: data.lon,
        };
      } else {
        console.warn(`IP Geolocation failed: ${data.message}`);
      }
    } catch (error) {
      console.error("IP geolocation failed", error);
    }

    return {};
  }

  static getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];

    let ip;

    if (typeof forwarded === "string") {
      ip = forwarded?.split(",")[0]?.trim();
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    } else {
      ip = "";
    }

    if (
      !ip ||
      ip.startsWith("127.") ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return "";
    }

    return ip;
  }

  static hashData(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static deleteOldImage(oldImagePath) {
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
        console.log("Local image deleted successfully::", oldImagePath);
      } catch (err) {
        console.log("Error deleting local image:", err.message);
      }
    } else {
      console.log("No local image to delete at:", oldImagePath);
    }
  }

  static generatePassword(length = 12) {
    if (length < 4) {
      throw new Error("Password length must be at least 4 characters.");
    }

    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    let password = "";

    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const passwordArray = password.split("");
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [
        passwordArray[j],
        passwordArray[i],
      ];
    }

    const shuffledPassword = passwordArray.join("");

    return shuffledPassword;
  }

  static generateTransactionPin(length = 4) {
    if (length < 1) {
      throw new Error("PIN length must be at least 1 digit.");
    }

    const numbers = "0123456789";
    let pin = "";

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const randomValues = new Uint32Array(length);
      crypto.getRandomValues(randomValues);
      for (let i = 0; i < length; i++) {
        pin += numbers.charAt(randomValues[i] % numbers.length);
      }
    } else {
      for (let i = 0; i < length; i++) {
        pin += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
    }

    return pin;
  }
}

export default Helper;
