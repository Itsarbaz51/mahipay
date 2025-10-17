import crypto from "crypto";
import Prisma from "../db/db.js";
import type {
  JwtPayload,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types/auth.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import {
  getCache,
  setCache,
  delCache,
  cacheUser,
  invalidateUserCache,
  clearPattern,
} from "../utils/redisCasheHelper.js";
import logger from "../utils/WinstonLogger.js";
import {
  recordLoginAttempt,
  resetLoginAttempts,
  addRevokedToken,
} from "../utils/securityCache.js";
import type { Request } from "express";
import S3Service from "../utils/S3Service.js";

class AuthServices {
  private static readonly USER_CACHE_TTL = 600; // 5 minutes

  // ===================== REGISTER =====================
  static async register(
    payload: RegisterPayload
  ): Promise<{ user: User; accessToken: string }> {
    const {
      username,
      firstName,
      lastName,
      profileImage,
      email,
      phoneNumber,
      transactionPin,
      // domainName,
      password,
      roleId,
      parentId,
    } = payload;

    const cacheKey = `user_check:${email}:${phoneNumber}:${username}`;
    let profileImageUrl = "";

    try {
      // Check cache first
      const cachedCheck = await getCache(cacheKey);

      if (!cachedCheck) {
        const existingUser = await Prisma.user.findFirst({
          where: {
            OR: [{ email }, { phoneNumber }, { username }],
          },
        });

        if (existingUser) {
          await setCache(cacheKey, "exists", 60);
          throw ApiError.badRequest("User already exists");
        }

        await setCache(cacheKey, "not_exists", 60);
      } else if (cachedCheck === "exists") {
        throw ApiError.badRequest("User already exists");
      }

      // Validate role
      const role = await Prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw ApiError.badRequest("Invalid roleId");

      const hashedPassword = await Helper.hashPassword(password);
      const hashedPin = await Helper.hashPassword(transactionPin);

      // Parent hierarchy setup
      let hierarchyLevel = 0;
      let hierarchyPath = "";

      if (parentId) {
        const parent = await Prisma.user.findUnique({
          where: { id: parentId },
        });
        if (!parent) throw ApiError.badRequest("Invalid parentId");
        hierarchyLevel = parent.hierarchyLevel + 1;
        hierarchyPath = parent.hierarchyPath
          ? `${parent.hierarchyPath}/${parentId}`
          : `${parentId}`;
      }

      // Upload profile image if present
      if (profileImage) {
        try {
          profileImageUrl =
            (await S3Service.upload(profileImage, "profile")) ?? "";
        } catch (uploadErr) {
          console.warn("Profile image upload failed:", uploadErr);
          // Optionally continue without throwing, or throw if image is required
        }
      }

      // Create user
      const user = await Prisma.user.create({
        data: {
          username,
          firstName,
          lastName,
          profileImage: profileImageUrl,
          email,
          phoneNumber,
          // domainName,
          roleId,
          password: hashedPassword,
          transactionPin: hashedPin,
          isAuthorized: false,
          isKycVerified: false,
          status: "ACTIVE",
          hierarchyLevel,
          hierarchyPath,
          parentId,
          refreshToken: null,
        },
        include: {
          role: { select: { id: true, name: true, level: true } },
          wallets: true,
          parent: { select: { id: true, username: true } },
          children: { select: { id: true, username: true } },
        },
      });

      // Create primary wallet
      await Prisma.wallet.create({
        data: {
          userId: user.id,
          balance: BigInt(0),
          currency: "INR",
          isPrimary: true,
        },
      });

      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
      });

      // Cache user
      await cacheUser(user.id, Helper.serializeUser(user), this.USER_CACHE_TTL);
      await clearPattern("user_check:*");

      // Audit log
      await Prisma.auditLog.create({
        data: { userId: user.id, action: "REGISTER", metadata: {} },
      });

      return { user, accessToken };
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err instanceof ApiError) throw err;

      throw ApiError.internal("Failed to register user. Please try again.");
    } finally {
      Helper.deleteOldImage(profileImage);
    }
  }

  // ===================== LOGIN =====================
  static async login(
    payload: LoginPayload,
    req: Request
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { emailOrUsername, password } = payload;

    const attempts = await recordLoginAttempt(emailOrUsername);
    if (attempts > 5)
      throw ApiError.badRequest("Too many attempts. Try again later.");

    const cacheKey = `user:login:${emailOrUsername}`;
    let user = await getCache<User>(cacheKey);

    if (!user) {
      user = await Prisma.user.findFirst({
        where: {
          OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
        include: { role: true, wallets: true },
      });

      if (user) {
        await setCache(cacheKey, Helper.serializeUser(user), 300); // Cache for 5 mins
      }
    }

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const isValid = await Helper.comparePassword(password, user.password);
    if (!isValid) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const accessToken = Helper.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role!.name,
      roleLevel: user.role!.level,
    });

    const refreshToken = Helper.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role!.name,
      roleLevel: user.role!.level,
    });

    await Prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Clean up login cache
    await delCache(cacheKey);
    await invalidateUserCache(user.id);
    await resetLoginAttempts(emailOrUsername);

    const ip = Helper.getClientIP(req);
    const geoData = await Helper.getGeoLocation(ip);

    const loginData: any = {
      userId: user.id,
      domainName: req.hostname,
      ipAddress: String(ip),
      userAgent: req.headers["user-agent"] || "",
    };

    if (geoData.location) loginData.location = geoData.location;
    if (geoData.latitude) loginData.latitude = geoData.latitude;
    if (geoData.longitude) loginData.longitude = geoData.longitude;

    await Prisma.loginLogs.create({ data: loginData });

    await Prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN", metadata: {} },
    });

    return { user, accessToken, refreshToken };
  }

  // ===================== LOGOUT =====================
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (!userId) return;

    await Prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    await invalidateUserCache(userId);

    if (refreshToken) {
      const payload = Helper.verifyRefreshToken(refreshToken);
      if (payload.jti && payload.exp) {
        await addRevokedToken(
          payload.jti,
          payload.exp - Math.floor(Date.now() / 1000)
        );
      }
    }

    await Prisma.auditLog.create({
      data: { userId, action: "LOGOUT", metadata: {} },
    });
  }

  // ===================== REFRESH TOKEN =====================
  static async refreshToken(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await Prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });
    if (!user || !user.refreshToken)
      throw ApiError.unauthorized("Invalid refresh token");

    if (user.refreshToken !== refreshToken) {
      await Prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      await invalidateUserCache(user.id);
      throw ApiError.unauthorized("Refresh token mismatch");
    }

    await addRevokedToken(
      payload.jti!,
      payload.exp! - Math.floor(Date.now() / 1000)
    );

    const newAccessToken = Helper.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
    });
    const newRefreshToken = Helper.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
    });

    await Prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    await Prisma.auditLog.create({
      data: { userId: user.id, action: "REFRESH_TOKEN", metadata: {} },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, email: user.email, role: user.role.name },
    };
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await Prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.warn("Password reset requested for non-existent email", { email });
      // Don't reveal that email doesn't exist
      return { message: "If the email exists, a reset link has been sent." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const subject = "Password Reset Instructions";
    const text = `You requested a password reset.\n\nClick the link to reset your password:\n${resetUrl}\n\nThis link expires in 5 minutes.`;
    const html = `
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 5 minutes.</p>
  `;

    await Helper.sendEmail({ to: user.email, subject, text, html });

    logger.info("Password reset link sent", { userId: user.id, email });

    return { message: "If the email exists, a reset link has been sent." };
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn("Invalid or expired password reset token attempted");
      throw ApiError.badRequest("Invalid or expired token");
    }

    const hashedPassword = await Helper.hashPassword(newPassword);

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // Invalidate all sessions
      },
    });

    // Clear user cache
    await invalidateUserCache(user.id);

    await Helper.sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      text: `Hello ${user.firstName || ""},\n\nYour password was successfully changed. If this wasn't you, please contact support immediately.`,
      html: `<p>Hello ${user.firstName || ""},</p><p>Your password was successfully changed. If this wasn't you, please <a href="mailto:support@example.com">contact support</a> immediately.</p>`,
    });

    logger.info("Password reset successful", { userId: user.id });

    return { message: "Password reset successful" };
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token) {
      logger.warn("Email verification attempted without token");
      throw ApiError.badRequest("Verification token missing");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
      },
    });

    if (!user) {
      logger.warn("Invalid email verification token attempted");
      throw ApiError.badRequest("Invalid verification token");
    }

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerifiedAt: new Date(),
        isAuthorized: true,
      },
    });

    // Clear user cache
    await invalidateUserCache(user.id);

    logger.info("Email verified successfully", { userId: user.id });

    return { message: "Email verified successfully" };
  }

  static async createAndSendEmailVerification(user: User) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpires: expires,
      },
    });

    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL env var is not defined");
    }

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

    await Helper.sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Click to verify your email: ${verifyUrl}\nLink valid for 24 hours.`,
      html: `
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">Verify Email</a></p>
      <p>This link is valid for 24 hours.</p>
    `,
    });

    logger.info("Email verification sent", {
      userId: user.id,
      email: user.email,
    });
  }

  // ===================== UPDATE PROFILE =====================
  static async updateProfile(
    userId: string,
    updateData: {
      username?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    }
  ): Promise<User> {
    const { username, phoneNumber } = updateData;

    // Check if username or phoneNumber already exists (excluding current user)
    if (username || phoneNumber) {
      const existingUser = await Prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(phoneNumber ? [{ phoneNumber }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw ApiError.badRequest("Username already taken");
        }
        if (existingUser.phoneNumber === phoneNumber) {
          throw ApiError.badRequest("Phone number already registered");
        }
      }
    }

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
    });

    // Update cache
    await cacheUser(
      userId,
      Helper.serializeUser(updatedUser),
      this.USER_CACHE_TTL
    );

    await Prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_PROFILE",
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    logger.info("Profile updated successfully", { userId });

    return updatedUser;
  }

  // ===================== UPDATE CREDENTIALS =====================
  static async updateCredentials(
    userId: string,
    credentialsData: {
      currentPassword: string;
      newPassword?: string;
      currentTransactionPin?: string;
      newTransactionPin?: string;
    }
  ): Promise<{ message: string }> {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Verify current password
    const isPasswordValid = await Helper.comparePassword(
      credentialsData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Current password is incorrect");
    }

    const updateData: any = {};

    // Update password if provided
    if (credentialsData.newPassword) {
      updateData.password = await Helper.hashPassword(
        credentialsData.newPassword
      );
      // Invalidate all sessions by clearing refresh token
      updateData.refreshToken = null;
    }

    // Update transaction PIN if provided
    if (credentialsData.newTransactionPin) {
      if (!credentialsData.currentTransactionPin) {
        throw ApiError.badRequest("Current transaction PIN is required");
      }

      // Verify current transaction PIN
      const isPinValid = await Helper.comparePassword(
        credentialsData.currentTransactionPin,
        user.transactionPin
      );

      if (!isPinValid) {
        throw ApiError.unauthorized("Current transaction PIN is incorrect");
      }

      updateData.transactionPin = await Helper.hashPassword(
        credentialsData.newTransactionPin
      );
    }

    await Prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Clear user cache
    await invalidateUserCache(userId);

    await Prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_CREDENTIALS",
        metadata: {
          updatedFields: [
            ...(credentialsData.newPassword ? ["password"] : []),
            ...(credentialsData.newTransactionPin ? ["transactionPin"] : []),
          ],
        },
      },
    });

    logger.info("Credentials updated successfully", { userId });

    return { message: "Credentials updated successfully" };
  }

  // ===================== UPDATE PROFILE IMAGE =====================
  static async updateProfileImage(
    userId: string,
    profileImagePath: string
  ): Promise<User> {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Delete old profile image from S3 if exists
    if (user.profileImage) {
      try {
        await S3Service.delete({ fileUrl: user.profileImage });
      } catch (error) {
        logger.error("Failed to delete old profile image", {
          userId,
          profileImage: user.profileImage,
          error,
        });
      }
    }

    // Upload new profile image
    const profileImageUrl =
      (await S3Service.upload(profileImagePath, "profile")) ?? "";

    Helper.deleteOldImage(profileImagePath);

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: { profileImage: profileImageUrl },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
    });

    // Update cache
    await cacheUser(
      userId,
      Helper.serializeUser(updatedUser),
      this.USER_CACHE_TTL
    );

    await Prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_PROFILE_IMAGE",
        metadata: { newImage: profileImageUrl },
      },
    });

    logger.info("Profile image updated successfully", { userId });

    return updatedUser;
  }
}

export default AuthServices;
