import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import type ms from "ms";
import type { SignOptions } from "jsonwebtoken";
import type { JwtInput, JwtPayload } from "../types/auth.types.js";
import axios from "axios";
import type { Request } from "express";
import crypto from "crypto";
import fs from "fs";
import logger from "./WinstonLogger.js";
import { Decimal } from "@prisma/client/runtime/library";

class Helper {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hashed: string) {
    return bcrypt.compare(password, hashed);
  }

  static generateAccessToken(payload: JwtInput) {
    const secret = process.env.ACCESS_TOKEN_SECRET!;
    const options: SignOptions = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue,
      jwtid: uuidv4(), // jti claim
    };
    return jwt.sign(payload, secret, options);
  }

  static generateRefreshToken(payload: JwtInput) {
    const secret = process.env.REFRESH_TOKEN_SECRET!;
    const options: SignOptions = {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue,
      jwtid: uuidv4(),
    };
    return jwt.sign(payload, secret, options);
  }

  static verifyRefreshToken(token: string) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;
  }

  static serializeUser(user: any): any {
    if (!user) return user;

    const serialized = { ...user };

    // Handle BigInt fields in wallets
    if (user.wallets) {
      serialized.wallets = user.wallets.map((wallet: any) => ({
        ...wallet,
        balance: wallet.balance?.toString() || "0",
        holdBalance: wallet.holdBalance?.toString() || "0",
        availableBalance: wallet.availableBalance?.toString() || "0",
        dailyLimit: wallet.dailyLimit?.toString() || null,
        monthlyLimit: wallet.monthlyLimit?.toString() || null,
        perTransactionLimit: wallet.perTransactionLimit?.toString() || null,
      }));
    }

    // Handle BigInt in bank accounts if needed
    if (user.bankInfo?.primaryAccount) {
      serialized.bankInfo.primaryAccount = {
        ...user.bankInfo.primaryAccount,
        // Add any BigInt conversions if your bank account has numeric fields
      };
    }

    // Handle date serialization for KYC
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

  static serializeCommisssion(data: any): any {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.serializeCommisssion(item));
    }

    // Handle objects
    if (typeof data === "object" && data !== null) {
      const serialized: Record<string, any> = {};

      for (const key in data) {
        const value = data[key];

        if (typeof value === "bigint") {
          serialized[key] = value.toString();
        } 
        // ✅ Convert Prisma Decimal to number (or string)
        else if (value instanceof Decimal) {
          serialized[key] = value.toNumber(); // or value.toString()
        } 
        else if (typeof value === "object" && value !== null) {
          serialized[key] = this.serializeCommisssion(value);
        } 
        else {
          serialized[key] = value;
        }
      }

      return serialized;
    }

    return data;
  }

  static async sendEmail({ to, subject, text, html }: any) {
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

  static async getGeoLocation(ip: string): Promise<{
    location?: string;
    latitude?: number;
    longitude?: number;
  }> {
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

  static getClientIP(req: Request): string {
    // `forwarded` can be string | string[] | undefined
    const forwarded = req.headers["x-forwarded-for"];

    let ip: string | undefined;

    if (typeof forwarded === "string") {
      ip = forwarded?.split(",")[0]?.trim();
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    } else {
      ip = ""; // fallback empty string if nothing else is available
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

  static hashData(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static deleteOldImage(oldImagePath: string) {
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
        logger.info("Local image deleted successfully::", oldImagePath);
      } catch (err: any) {
        logger.error("Error deleting local image:", err.message);
      }
    } else {
      logger.info("No local image to delete at:", oldImagePath);
    }
  }
}

export default Helper;
