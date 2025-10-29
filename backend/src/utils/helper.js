import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import { Decimal } from "@prisma/client/runtime/library";

class Helper {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  static async comparePassword(password, hashed) {
    return bcrypt.compare(password, hashed);
  }

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
        balance: wallet.balance?.toString() || "0",
        holdBalance: wallet.holdBalance?.toString() || "0",
        availableBalance: wallet.availableBalance?.toString() || "0",
        dailyLimit: wallet.dailyLimit?.toString() || null,
        monthlyLimit: wallet.monthlyLimit?.toString() || null,
        perTransactionLimit: wallet.perTransactionLimit?.toString() || null,
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

  static serializeCommisssion(data) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.serializeCommisssion(item));
    }

    if (typeof data === "object" && data !== null) {
      const serialized = {};

      for (const key in data) {
        const value = data[key];

        if (typeof value === "bigint") {
          serialized[key] = value.toString();
        } else if (value instanceof Decimal) {
          serialized[key] = value.toNumber();
        } else if (typeof value === "object" && value !== null) {
          serialized[key] = this.serializeCommisssion(value);
        } else {
          serialized[key] = value;
        }
      }

      return serialized;
    }

    return data;
  }

  static async sendEmail({ to, subject, text, html }) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    return transporter.sendMail({
      from: process.env.FROM_EMAIL || `"App" <${process.env.SMTP_USER}>`,
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
}

export default Helper;