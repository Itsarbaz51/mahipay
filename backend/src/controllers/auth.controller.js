import asyncHandler from "../utils/AsyncHandler.js";
import AuthServices from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

class AuthController {
  static login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await AuthServices.login(
      req.body,
      req
    );

    const safeUser = Helper.serializeUser(user);

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

  static logout = asyncHandler(async (req, res) => {
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

  static refreshToken = asyncHandler(async (req, res) => {
    const incomingRefresh = req.cookies?.refreshToken;

    if (!incomingRefresh) {
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

  static requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest("Email is required");
    }

    const result = await AuthServices.requestPasswordReset(email);

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static confirmPasswordReset = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw ApiError.badRequest("Token is required");
    }

    const result = await AuthServices.confirmPasswordReset(token);

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw ApiError.badRequest("token required");
    }

    const result = await AuthServices.verifyEmail(String(token));

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static updateCredentials = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const credentialsData = req.body;

    const result = await AuthServices.updateCredentials(
      userId,
      credentialsData,
      currentUserId
    );

    const isUpdatingOwnAccount = currentUserId === userId;

    return res.status(200).json(
      ApiResponse.success(
        {
          isOwnUpdate: isUpdatingOwnAccount,
        },
        result.message,
        200
      )
    );
  });
}

export default AuthController;
