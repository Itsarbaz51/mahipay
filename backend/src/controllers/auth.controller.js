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

    let user, accessToken, refreshToken, authenticatedUserType, permissions;

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
          permissions,
        } = await BusinessAuthService.login(req.body, req));
        break;

      case "EMPLOYEE":
        ({
          user,
          accessToken,
          refreshToken,
          userType: authenticatedUserType,
          permissions,
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

    const responseData = {
      user: userWithoutSensitiveData,
      accessToken,
      userType: authenticatedUserType,
      ...(permissions && { permissions }),
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json(
        ApiResponse.success(
          responseData,
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

    let accessToken, refreshToken, user, permissions;

    // Try each service until we find the right one
    try {
      ({ accessToken, refreshToken, user } = await RootAuthService.refreshToken(
        incomingRefresh,
        req
      ));
    } catch (error) {
      try {
        ({ accessToken, refreshToken, user, permissions } =
          await BusinessAuthService.refreshToken(incomingRefresh, req));
      } catch (error) {
        ({ accessToken, refreshToken, user, permissions } =
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

    const responseData = {
      accessToken,
      user: userWithoutSensitiveData,
      ...(permissions && { permissions }),
    };

    return res
      .status(200)
      .json(
        ApiResponse.success(responseData, "Token refreshed successfully", 200)
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
    // Get token + userType from URL query
    const token = req.query.token;
    const userType = req.query.type;

    if (!token || !userType) {
      throw ApiError.badRequest("Token and user type are required");
    }

    let result;

    switch (userType.toUpperCase()) {
      case "ROOT":
        result = await RootAuthService.confirmPasswordReset(token, req);
        break;

      case "BUSINESS":
        result = await BusinessAuthService.confirmPasswordReset(token, req);
        break;

      case "EMPLOYEE":
        result = await EmployeeAuthService.confirmPasswordReset(token, req);
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  //Everyone credentials UPDATE METHODS
  static updateCredentials = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id;
    const currentUserType = req.user?.userType;
    const targetUserId = req.params.userId;
    const currentUserRole = req.user?.role;

    if (!currentUserId || !currentUserType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const credentialsData = req.body;

    let result;

    switch (currentUserType.toUpperCase()) {
      case "ROOT":
        result = await RootAuthService.updateCredentials({
          currentUserId,
          currentUserType,
          targetUserId,
          credentialsData,
          currentUserRole,
          req,
        });
        break;

      case "BUSINESS":
        result = await BusinessAuthService.updateCredentials({
          currentUserId,
          currentUserType,
          targetUserId,
          credentialsData,
          currentUserRole,
          req,
        });
        break;

      case "EMPLOYEE":
        result = await EmployeeAuthService.updateCredentials({
          currentUserId,
          currentUserType,
          targetUserId,
          credentialsData,
          currentUserRole,
          req,
        });
        break;

      default:
        throw ApiError.badRequest("Invalid user type");
    }

    const isUpdatingOwnAccount = currentUserId === targetUserId;

    return res.status(200).json(
      ApiResponse.success(
        {
          isOwnUpdate: isUpdatingOwnAccount,
          updatedFields: result.updatedFields,
          targetUserType: result.targetUserType,
        },
        result.message,
        200
      )
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

  //OWN PROFILE UPDATE METHODS
  static updateProfile = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id;
    const userType = req.user?.userType;
    const updateData = req.body;

    if (!currentUserId || !userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    let updatedProfile;

    switch (userType.toUpperCase()) {
      case "ROOT":
        updatedProfile = await RootAuthService.updateProfile(
          currentUserId,
          updateData,
          req
        );
        break;

      case "BUSINESS":
        updatedProfile = await BusinessAuthService.updateProfile(
          currentUserId,
          updateData,
          req
        );
        break;

      case "EMPLOYEE":
        updatedProfile = await EmployeeAuthService.updateProfile(
          currentUserId,
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

  //OWN PROFILE UPDATE METHODS
  static updateProfileImage = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id;
    const userType = req.user?.userType;

    if (!currentUserId || !userType) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!req.file) {
      throw ApiError.badRequest("Profile image is required");
    }

    // File validation
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      await Helper.deleteOldImage(req.file.path);
      throw ApiError.badRequest(
        "Invalid file type. Only JPEG, PNG, JPG, GIF are allowed"
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      await Helper.deleteOldImage(req.file.path);
      throw ApiError.badRequest("File size too large. Maximum size is 5MB");
    }

    let updateResult;

    switch (userType.toUpperCase()) {
      case "ROOT":
        updateResult = await RootAuthService.updateProfileImage(
          currentUserId,
          req.file.path,
          req
        );
        break;

      case "BUSINESS":
        updateResult = await BusinessAuthService.updateProfileImage(
          currentUserId,
          req.file.path,
          req
        );
        break;

      case "EMPLOYEE":
        updateResult = await EmployeeAuthService.updateProfileImage(
          currentUserId,
          req.file.path,
          req
        );
        break;

      default:
        await Helper.deleteOldImage(req.file.path);
        throw ApiError.badRequest("Invalid user type");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          updateResult,
          "Profile image updated successfully",
          200
        )
      );
  });
}

export default AuthController;
