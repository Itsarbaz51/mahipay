import crypto from "crypto";
import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import { CryptoService } from "../utils/cryptoService.js";
import UserServices from "./user.service.js";

class AuthServices {
  static async login(payload, req) {
    const { emailOrUsername, password } = payload;

    const user = await Prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: {
        role: true,
        wallets: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const isValid = CryptoService.decrypt(user.password);

    if (isValid !== password) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const accessToken = Helper.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
    });

    const refreshToken = Helper.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
    });

    await Prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const ip = Helper.getClientIP(req);
    const geoData = await Helper.getGeoLocation(ip);

    const loginData = {
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

  static async logout(userId, refreshToken) {
    if (!userId) return;

    await Prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    if (refreshToken) {
      const payload = Helper.verifyRefreshToken(refreshToken);
      if (payload.jti && payload.exp) {
        // Token revocation logic if needed (could store in database)
        // await addRevokedToken(payload.jti, payload.exp - Math.floor(Date.now() / 1000));
      }
    }

    await Prisma.auditLog.create({
      data: { userId, action: "LOGOUT", metadata: {} },
    });
  }

  static async refreshToken(refreshToken) {
    let payload;
    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await Prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        role: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
      },
    });

    if (!user || !user.refreshToken)
      throw ApiError.unauthorized("Invalid refresh token");

    if (user.refreshToken !== refreshToken) {
      await Prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw ApiError.unauthorized("Refresh token mismatch");
    }

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
      user: Helper.serializeUser(user),
    };
  }

  static async requestPasswordReset(email) {
    const user = await Prisma.user.findUnique({
      where: { email },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
      },
    });

    if (!user) {
      return { message: "User not found." };
    }

    const token = CryptoService.generateSecureToken(32);
    const tokenHash = CryptoService.hashData(token);
    const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
    });

    // Encrypt the token for URL safety
    const encryptedToken = CryptoService.encrypt(token);
    const resetUrl = `${process.env.CLIENT_URL}/verify-reset-password?token=${encodeURIComponent(encryptedToken)}&email=${encodeURIComponent(email)}`;

    const formattedFirstName = AuthServices.formatName(user.firstName);

    const subject = "Password Reset Instructions";
    const text = `Hello ${formattedFirstName},\n\nYou requested a password reset.\n\nClick the link to reset your password:\n${resetUrl}\n\nThis link expires in 2 minutes.`;
    const html = `
    <p>Hello ${formattedFirstName},</p>
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 2 minutes.</p>
  `;

    await Helper.sendEmail({ to: user.email, subject, text, html });

    return { message: "Password reset link has been sent to your email." };
  }

  static async confirmPasswordReset(encryptedToken) {
    try {
      const token = CryptoService.decrypt(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      const user = await Prisma.user.findFirst({
        where: {
          passwordResetToken: tokenHash,
          passwordResetExpires: { gt: new Date() },
        },
        include: {
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
        },
      });

      if (!user) {
        throw ApiError.badRequest("Invalid or expired token");
      }

      const hashedPassword = await UserServices.regenerateCredentialsAndNotify(
        user.id,
        user.email
      );

      await Prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          refreshToken: null, // Invalidate all sessions
        },
      });

      return {
        message:
          "Password reset successfully, and your credentials have been sent to your email.",
      };
    } catch (error) {
      if (error.message.includes("Decryption failed")) {
        throw ApiError.badRequest("Invalid or malformed token");
      }
      throw error;
    }
  }

  static async verifyEmail(token) {
    if (!token) {
      throw ApiError.badRequest("Verification token missing");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
      },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.badRequest("Invalid verification token");
    }

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerifiedAt: new Date(),
      },
    });

    return { message: "Email verified successfully" };
  }

  static async createAndSendEmailVerification(user) {
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

    const formattedFirstName = AuthServices.formatName(user.firstName);

    await Helper.sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Hello ${formattedFirstName},\n\nClick to verify your email: ${verifyUrl}\nLink valid for 24 hours.`,
      html: `
      <p>Hello ${formattedFirstName},</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">Verify Email</a></p>
      <p>This link is valid for 24 hours.</p>
    `,
    });
  }

  static async updateCredentials(userId, credentialsData, requestedBy) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isOwnUpdate = requestedBy === userId;

    const decryptedStoredPassword = CryptoService.decrypt(user.password);
    const isPasswordValid =
      decryptedStoredPassword === credentialsData.currentPassword;

    if (!isPasswordValid) {
      throw ApiError.unauthorized("User's current password is incorrect");
    }

    const updateData = {};

    if (credentialsData.newPassword) {
      updateData.password = CryptoService.encrypt(credentialsData.newPassword);
      updateData.refreshToken = null;
    }

    if (credentialsData.newTransactionPin) {
      if (!credentialsData.currentTransactionPin) {
        throw ApiError.badRequest("Current transaction PIN is required");
      }

      const decryptedStoredPin = CryptoService.decrypt(user.transactionPin);
      const isPinValid =
        decryptedStoredPin === credentialsData.currentTransactionPin;

      if (!isPinValid) {
        throw ApiError.unauthorized("Current transaction PIN is incorrect");
      }

      updateData.transactionPin = CryptoService.encrypt(
        credentialsData.newTransactionPin
      );
    }

    await Prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await Prisma.auditLog.create({
      data: {
        userId: requestedBy || userId,
        action: "UPDATE_CREDENTIALS",
        metadata: {
          updatedFields: [
            ...(credentialsData.newPassword ? ["password"] : []),
            ...(credentialsData.newTransactionPin ? ["transactionPin"] : []),
          ],
          isOwnUpdate: isOwnUpdate,
          updatedBy: requestedBy,
          targetUserId: userId,
        },
      },
    });

    return { message: "Credentials updated successfully" };
  }

  // ===================== HELPER METHODS =====================
  static formatName(name) {
    if (!name) return name;

    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  }
}

export default AuthServices;
