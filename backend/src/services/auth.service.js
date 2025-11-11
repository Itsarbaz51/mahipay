import crypto from "crypto";
import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import { CryptoService } from "../utils/cryptoService.js";
import EmployeeServices from "./employee.service.js";
import {
  sendCredentialsEmail,
  sendPasswordResetEmail,
} from "../utils/sendCredentialsEmail.js";
import AuditLogService from "./auditLog.service.js";
import LoginLogService from "./loginLog.service.js";
import { UserPermissionService } from "./permission.service.js";

class AuthServices {
  static async login(payload, req, res) {
    const { emailOrUsername, password, latitude, longitude, accuracy } =
      payload;

    const user = await Prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            level: true,
            type: true,
            description: true,
          },
        },
        wallets: {
          where: {
            isActive: true,
          },
        },
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
      if (req) {
        await AuditLogService.createAuditLog({
          userId: req.id,
          action: "LOGIN_RETRIEVAL_FAILED",
          entityType: "LOGIN",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            reason: "USER_NOT_FOUND",
          },
        });
      }
      throw ApiError.unauthorized("User not found");
    }

    const isValid = CryptoService.decrypt(user.password);

    if (isValid !== password) {
      if (req) {
        await AuditLogService.createAuditLog({
          userId: req.id,
          action: "LOGIN_CREDENTIALS_FAILED",
          entityType: "LOGIN",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            reason: "Invalid credentials",
          },
        });
      }
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Generate tokens with role type information
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
      roleType: user.role.type,
    };

    // Include permissions for employees
    if (user.role.type === "employee") {
      const permissions = await EmployeeServices.getEmployeePermissions(
        user.id
      );
      tokenPayload.permissions = permissions;

      // Also include permissions in user object for frontend
      user.userPermissions = permissions;
    } else if (
      [
        "ADMIN",
        "STATE HEAD",
        "MASTER DISTRIBUTOR",
        "DISTRIBUTOR",
        "RETAILER",
      ].includes(user.role.name)
    ) {
      const permissions = await UserPermissionService.getUserPermissions(
        user.id
      );
      tokenPayload.permissions = permissions;

      user.userPermissions = permissions;
    }

    const accessToken = Helper.generateAccessToken(tokenPayload);
    const refreshToken = Helper.generateRefreshToken(tokenPayload);

    await Prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Get IP address
    const ip = Helper.getClientIP(req);

    // Handle client location if provided
    let clientLocation = null;
    if (latitude && longitude) {
      try {
        clientLocation = await Helper.reverseGeocode(latitude, longitude);
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        clientLocation = { address: `${latitude}, ${longitude}` };
      }
    }

    // Create login log data
    const loginData = {
      userId: user.id,
      domainName: req.hostname,
      ipAddress: String(ip),
      userAgent: req.headers["user-agent"] || "",
      roleType: user.role.type,
    };

    // Add client location data if available
    if (clientLocation) {
      loginData.latitude = latitude;
      loginData.longitude = longitude;
      loginData.location = clientLocation.address;
      loginData.accuracy = accuracy;
    }

    await LoginLogService.createLoginLog(loginData);

    await AuditLogService.createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "AUTH",
      entityId: user.id,
      ipAddress: req.ip,
      metadata: {
        ...Helper.generateCommonMetadata(req, res),
        roleType: user.role.type,
        roleName: user.role.name,
      },
    });

    return { user, accessToken, refreshToken };
  }

  static async getUserById(userId, currentUser = null) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              level: true,
              description: true,
              type: true,
            },
          },
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
          kycs: {
            include: {
              address: {
                include: {
                  state: {
                    select: {
                      id: true,
                      stateName: true,
                      stateCode: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                  city: {
                    select: {
                      id: true,
                      cityName: true,
                      cityCode: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          bankAccounts: {
            where: { status: "VERIFIED" },
            orderBy: { isPrimary: "desc" },
          },
          userPermissions: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  isActive: true,
                },
              },
            },
          },
          piiConsents: {
            select: {
              id: true,
              piiType: true,
              scope: true,
              providedAt: true,
              expiresAt: true,
              userKycId: true,
            },
            where: { expiresAt: { gt: new Date() } },
          },
        },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      // Get permissions based on role
      try {
        if (user.role.type === "employee") {
          // Employee-specific permissions
          const permissions = await EmployeeServices.getEmployeePermissions(
            user.id
          );
          user.userPermissions = permissions;
        } else if (
          [
            "ADMIN",
            "STATE HEAD",
            "MASTER DISTRIBUTOR",
            "DISTRIBUTOR",
            "RETAILER",
          ].includes(user.role.name)
        ) {
          const permissions = await UserPermissionService.getUserPermissions(
            user.id
          );
          user.userPermissions = permissions;
        } else {
          user.userPermissions = [];
        }
      } catch (error) {
        console.error(`Failed to get permissions for user ${user.id}:`, error);
        user.userPermissions = [];
      }

      // Transform user data
      const transformedUser = {
        ...user,
        kycInfo:
          user.kycs.length > 0
            ? {
                currentStatus: user.kycs[0].status,
                isKycSubmitted: true,
                latestKyc: user.kycs[0],
                kycHistory: user.kycs,
                totalKycAttempts: user.kycs.length,
              }
            : {
                currentStatus: "NOT_SUBMITTED",
                isKycSubmitted: false,
                latestKyc: null,
                kycHistory: [],
                totalKycAttempts: 0,
              },
        bankInfo: {
          totalAccounts: user.bankAccounts.length,
          primaryAccount:
            user.bankAccounts.find((acc) => acc.isPrimary) || null,
          verifiedAccounts: user.bankAccounts,
        },
        // Remove original arrays to avoid duplication
        kycs: undefined,
        bankAccounts: undefined,
      };

      // Serialize and secure sensitive data
      const serialized = Helper.serializeUser(transformedUser);
      const isCurrentUserAdmin =
        currentUser && currentUser.role?.name === "ADMIN";

      let safeUser;
      if (isCurrentUserAdmin) {
        // Admin can see decrypted sensitive data
        safeUser = { ...serialized };

        if (safeUser.password) {
          try {
            safeUser.password = CryptoService.decrypt(safeUser.password);
          } catch (error) {
            console.error(
              `Failed to decrypt password for user ${userId}:`,
              error
            );
            safeUser.password = "Error decrypting";
          }
        }

        if (safeUser.transactionPin) {
          try {
            safeUser.transactionPin = CryptoService.decrypt(
              safeUser.transactionPin
            );
          } catch (error) {
            console.error(
              `Failed to decrypt transaction pin for user ${userId}:`,
              error
            );
            safeUser.transactionPin = "Error decrypting";
          }
        }
      } else {
        // Non-admin users get sanitized data
        const { password, transactionPin, refreshToken, ...safeData } =
          serialized;
        safeUser = safeData;
      }

      return safeUser;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`Error in getUserById for user ${userId}:`, error);
      throw ApiError.internal("Failed to retrieve user data");
    }
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
        // Token revocation logic if needed
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
        role: {
          select: {
            id: true,
            name: true,
            level: true,
            type: true,
            description: true,
          },
        },
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

    // Generate new tokens with updated role information
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
      roleType: user.role.type,
    };

    // Include permissions for employees
    if (user.role.type === "employee") {
      const permissions = await EmployeeServices.getEmployeePermissions(
        user.id
      );
      tokenPayload.permissions = permissions;
    }

    const newAccessToken = Helper.generateAccessToken(tokenPayload);
    const newRefreshToken = Helper.generateRefreshToken(tokenPayload);

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
    const user = await Prisma.user.findFirst({
      where: { email },
      include: {
        role: {
          select: {
            name: true,
            type: true,
          },
        },
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
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
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

    // Send type-specific password reset email
    const userType = user.role.type === "employee" ? "employee" : "business";

    await sendPasswordResetEmail(
      user,
      resetUrl,
      userType,
      `We received a request to reset your ${userType} account password. Click the link below to create a new secure password.`
    );

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
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
          role: {
            select: {
              type: true,
              name: true,
            },
          },
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

      // Generate new credentials
      const generatedPassword = Helper.generatePassword();
      const hashedPassword = CryptoService.encrypt(generatedPassword);

      let generatedTransactionPin = null;
      let hashedPin = null;

      // Only business users get transaction pin
      if (user.role.type === "business") {
        generatedTransactionPin = Helper.generateTransactionPin();
        hashedPin = CryptoService.encrypt(generatedTransactionPin);
      }

      // Update user data
      const updateData = {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // Invalidate all sessions
      };

      if (hashedPin) {
        updateData.transactionPin = hashedPin;
      }

      await Prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Send type-specific credentials email
      if (user.role.type === "employee") {
        const permissions = await EmployeeServices.getEmployeePermissions(
          user.id
        );
        await sendCredentialsEmail(
          user,
          generatedPassword,
          null,
          "reset",
          `Your employee account password has been reset successfully. Here are your new login credentials.`,
          "employee",
          {
            role: user.role.name,
            permissions: permissions,
          }
        );
      } else {
        await sendCredentialsEmail(
          user,
          generatedPassword,
          generatedTransactionPin,
          "reset",
          `Your business account password has been reset successfully. Here are your new login credentials.`,
          "business"
        );
      }

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

    const userType = user.role?.type === "employee" ? "employee" : "business";

    // Use EmailTemplates for email verification
    const emailContent = EmailTemplates.generateEmailVerificationTemplate({
      firstName: user.firstName,
      verifyUrl: verifyUrl,
      userType: userType,
    });

    await Helper.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  }

  static async updateCredentials(userId, credentialsData, requestedBy) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            type: true,
          },
        },
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

    // Verify current password
    const decryptedStoredPassword = CryptoService.decrypt(user.password);
    const isPasswordValid =
      decryptedStoredPassword === credentialsData.currentPassword;

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Current password is incorrect");
    }

    const updateData = {};

    if (credentialsData.newPassword) {
      updateData.password = CryptoService.encrypt(credentialsData.newPassword);
      updateData.refreshToken = null; // Invalidate all sessions
    }

    // Only business users have transaction pins
    if (credentialsData.newTransactionPin && user.role.type === "business") {
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
          userType: user.role.type,
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
