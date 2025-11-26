import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import EmployeeAuthService from "../services/employee/auth.service.js";
import RootAuthService from "../services/root/auth.service.js";
import BusinessAuthService from "../services/business/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};

class AuthController {
  static login = asyncHandler(async (req, res) => {
    const { userType } = req.body;

    if (!userType) {
      throw ApiError.badRequest("User type is required");
    }

    let user, accessToken, refreshToken, authenticatedUserType;

    switch (userType.toUpperCase()) {
      case "ROOT":
        ({
          user,
          accessToken,
          refreshToken,
          userType: authenticatedUserType,
        } = await RootAuthService.login(req.body, req));
        break;

      case "BUSINESS":
        ({
          user,
          accessToken,
          refreshToken,
          userType: authenticatedUserType,
        } = await BusinessAuthService.login(req.body, req));
        break;

      case "EMPLOYEE":
        ({
          user,
          accessToken,
          refreshToken,
          userType: authenticatedUserType,
        } = await EmployeeAuthService.login(req.body, req));
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    // Serialize and remove sensitive fields
    const safeUser = Helper.serializeUser(user);
    const {
      password,
      transactionPin,
      refreshToken: _,
      ...userWithoutSensitiveData
    } = safeUser;

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json(
        ApiResponse.success(
          {
            user: userWithoutSensitiveData,
            accessToken,
            userType: authenticatedUserType,
          },
          `${userWithoutSensitiveData.email} login successful`,
          200
        )
      );
  });

  // GET CURRENT USER
  static getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userType = req.user?.userType;

    if (!userId || !userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    try {
      let safeUser;

      switch (userType.toUpperCase()) {
        case "ROOT":
          safeUser = await RootAuthService.getProfile(userId);
          break;

        case "BUSINESS":
          safeUser = await BusinessAuthService.getProfile(userId);
          break;

        case "EMPLOYEE":
          safeUser = await EmployeeAuthService.getProfile(userId);
          break;

        default:
          throw ApiError.badRequest("Invalid user type");
      }

      if (!safeUser) {
        throw ApiError.notFound("User not found");
      }

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Current user fetched successfully",
            200
          )
        );
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw ApiError.internal("Failed to fetch user data");
    }
  });

  static logout = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    const refreshToken = req.cookies?.refreshToken;

    if (!userId || !userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    switch (userType.toUpperCase()) {
      case "ROOT":
        await RootAuthService.logout(userId, refreshToken, req);
        break;

      case "BUSINESS":
        await BusinessAuthService.logout(userId, refreshToken, req);
        break;

      case "EMPLOYEE":
        await EmployeeAuthService.logout(userId, refreshToken, req);
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

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

    let accessToken, refreshToken, user;

    // Try each service until we find the right one
    try {
      ({ accessToken, refreshToken, user } = await RootAuthService.refreshToken(
        incomingRefresh,
        req
      ));
    } catch (error) {
      try {
        ({ accessToken, refreshToken, user } =
          await BusinessAuthService.refreshToken(incomingRefresh, req));
      } catch (error) {
        ({ accessToken, refreshToken, user } =
          await EmployeeAuthService.refreshToken(incomingRefresh, req));
      }
    }

    if (!accessToken || !user) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    res.cookie("accessToken", accessToken, cookieOptions);

    const safeUser = Helper.serializeUser(user);
    const {
      password,
      transactionPin,
      refreshToken: _,
      ...userWithoutSensitiveData
    } = safeUser;

    return res.status(200).json(
      ApiResponse.success(
        {
          accessToken,
          user: userWithoutSensitiveData,
        },
        "Token refreshed successfully",
        200
      )
    );
  });

  static requestPasswordReset = asyncHandler(async (req, res) => {
    const { email, userType } = req.body;

    if (!email || !userType) {
      throw ApiError.badRequest("Email and user type are required");
    }

    let result;

    switch (userType.toUpperCase()) {
      case "ROOT":
        result = await RootAuthService.requestPasswordReset(email, req);
        break;

      case "BUSINESS":
        result = await BusinessAuthService.requestPasswordReset(email, req);
        break;

      case "EMPLOYEE":
        result = await EmployeeAuthService.requestPasswordReset(email, req);
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static confirmPasswordReset = asyncHandler(async (req, res) => {
    const { token, userType, newPassword } = req.body;

    if (!token || !userType || !newPassword) {
      throw ApiError.badRequest(
        "Token, user type and new password are required"
      );
    }

    let result;

    switch (userType.toUpperCase()) {
      case "ROOT":
        result = await RootAuthService.confirmPasswordReset(
          token,
          newPassword,
          req
        );
        break;

      case "BUSINESS":
        result = await BusinessAuthService.confirmPasswordReset(
          token,
          newPassword,
          req
        );
        break;

      case "EMPLOYEE":
        result = await EmployeeAuthService.confirmPasswordReset(
          token,
          newPassword,
          req
        );
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    const { token, userType } = req.query;

    if (!token || !userType) {
      throw ApiError.badRequest("Token and user type are required");
    }

    let result;

    switch (userType.toUpperCase()) {
      case "ROOT":
        result = await RootAuthService.verifyEmail(String(token), req);
        break;

      case "BUSINESS":
        result = await BusinessAuthService.verifyEmail(String(token), req);
        break;

      case "EMPLOYEE":
        result = await EmployeeAuthService.verifyEmail(String(token), req);
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static updateCredentials = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserType = req.user?.userType;

    if (!currentUserId || !currentUserType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const credentialsData = req.body;

    let result;

    switch (currentUserType.toUpperCase()) {
      case "ROOT":
        result = await RootAuthService.updateCredentials(
          userId,
          credentialsData,
          req
        );
        break;

      case "BUSINESS":
        result = await BusinessAuthService.updateCredentials(
          userId,
          credentialsData,
          currentUserId,
          req
        );
        break;

      case "EMPLOYEE":
        result = await EmployeeAuthService.updateCredentials(
          userId,
          credentialsData,
          req
        );
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

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

  // NEW METHOD: Create and send email verification
  static sendEmailVerification = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userType = req.user?.userType;

    if (!userId || !userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    switch (userType.toUpperCase()) {
      case "ROOT":
        const rootUser = await RootAuthService.getProfile(userId);
        await RootAuthService.createAndSendEmailVerification(rootUser, req);
        break;

      case "BUSINESS":
        const businessUser = await BusinessAuthService.getProfile(userId);
        await BusinessAuthService.createAndSendEmailVerification(
          businessUser,
          req
        );
        break;

      case "EMPLOYEE":
        const employeeUser = await EmployeeAuthService.getProfile(userId);
        await EmployeeAuthService.createAndSendEmailVerification(
          employeeUser,
          req
        );
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(null, "Verification email sent successfully", 200)
      );
  });

  // DASHBOARD METHODS
  static getDashboard = asyncHandler(async (req, res) => {
    const userType = req.user?.userType;

    if (!userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    let dashboardData;

    switch (userType.toUpperCase()) {
      case "ROOT":
        dashboardData = await RootAuthService.getRootDashboard(req.user, req);
        break;

      case "BUSINESS":
        dashboardData = await BusinessAuthService.getAdminDashboard(
          req.user,
          req
        );
        break;

      case "EMPLOYEE":
        dashboardData = await EmployeeAuthService.getEmployeeDashboard(
          req.user,
          req
        );
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          dashboardData,
          "Dashboard data fetched successfully",
          200
        )
      );
  });

  // PROFILE UPDATE METHODS
  static updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    const updateData = req.body;

    if (!userId || !userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    let updatedProfile;

    switch (userType.toUpperCase()) {
      case "ROOT":
        updatedProfile = await RootAuthService.updateProfile(
          userId,
          updateData,
          req
        );
        break;

      case "BUSINESS":
        updatedProfile = await BusinessAuthService.getProfile(userId); // Business might not have updateProfile
        break;

      case "EMPLOYEE":
        updatedProfile = await EmployeeAuthService.updateProfile(
          userId,
          updateData,
          req
        );
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: updatedProfile },
          "Profile updated successfully",
          200
        )
      );
  });
}

export default AuthController;
