// controllers/auth.controller.ts
import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import AuthServices from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import logger from "../utils/WinstonLogger.js";

const cookieOptions: import("express").CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      logger.error("Parent ID missing during registration");
      throw ApiError.internal("Parent id is missing");
    }

    const data: any = { ...req.body };

    if (req.file) {
      data.profileImage = req.file.path;
    }

    const { user, accessToken } = await AuthServices.register({
      ...data,
      parentId: userId,
    });

    if (!user || !accessToken) {
      logger.error("User creation failed during registration");
      throw ApiError.internal("User creation failed!");
    }

    // await AuthServices.createAndSendEmailVerification(user);

    const safeUser = Helper.serializeUser(user);

    logger.info("User registration completed successfully", {
      userId: user.id,
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          { user: safeUser, accessToken },
          "User created successfully",
          201
        )
      );
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await AuthServices.login(
      req.body,
      req
    );

    const safeUser = Helper.serializeUser(user);

    logger.info("User login completed", { userId: user.id });

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        ApiResponse.success(
          { user: safeUser, accessToken },
          `${safeUser.email} login successful`,
          200
        )
      );
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const refreshToken = req.cookies?.refreshToken;

    if (!userId) throw ApiError.unauthorized("User not authenticated");

    await AuthServices.logout(userId, refreshToken);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res
      .status(200)
      .json(ApiResponse.success(null, "Logout successful", 200));
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefresh = req.cookies?.refreshToken;

    if (!incomingRefresh) {
      logger.warn("Refresh token missing in request");
      throw ApiError.unauthorized("Refresh token missing");
    }

    const { accessToken, refreshToken, user } =
      await AuthServices.refreshToken(incomingRefresh);

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.cookie("accessToken", accessToken, cookieOptions);

    const safeUser = Helper.serializeUser(user);

    logger.info("Token refresh completed", { userId: user.id });

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { accessToken, user: safeUser },
          "Token refreshed",
          200
        )
      );
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      logger.warn("Forgot password attempted without email");
      throw ApiError.badRequest("Email is required");
    }

    const result = await AuthServices.forgotPassword(email);

    logger.info("Forgot password request processed", { email });

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      logger.warn("Reset password attempted with missing fields");
      throw ApiError.badRequest("token and newPassword required");
    }

    const result = await AuthServices.resetPassword(token, newPassword);

    logger.info("Password reset completed successfully");

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token) {
      logger.warn("Email verification attempted without token");
      throw ApiError.badRequest("token required");
    }

    const result = await AuthServices.verifyEmail(String(token));

    logger.info("Email verification completed");

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id || req.body;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const updateData = req.body;
    const user = await AuthServices.updateProfile(userId, updateData);

    const safeUser = Helper.serializeUser(user);

    logger.info("User profile updated successfully", { userId });

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Profile updated successfully",
          200
        )
      );
  });

  static updateCredentials = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthorized("User not authenticated");
      }

      const credentialsData = req.body;
      const result = await AuthServices.updateCredentials(
        userId,
        credentialsData
      );

      // Clear cookies if password was changed (since refresh token is invalidated)
      if (credentialsData.newPassword) {
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
      }

      logger.info("User credentials updated successfully", { userId });

      return res
        .status(200)
        .json(ApiResponse.success(null, result.message, 200));
    }
  );

  static updateProfileImage = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthorized("User not authenticated");
      }

      if (!req.file) {
        throw ApiError.badRequest("Profile image is required");
      }

      const user = await AuthServices.updateProfileImage(userId, req.file.path);

      const safeUser = Helper.serializeUser(user);

      logger.info("User profile image updated successfully", { userId });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Profile image updated successfully",
            200
          )
        );
    }
  );
}

export default AuthController;
