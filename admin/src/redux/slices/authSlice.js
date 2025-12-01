import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ZodErrorCatch } from "../../utils/ZodErrorCatch";
import AuthValidationSchemas from "../../utils/validation/AuthValidationSchemas";

// Configure axios once
if (!axios.defaults.baseURL) {
  axios.defaults.withCredentials = true;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  axios.defaults.baseURL = baseURL;
}

const initialState = {
  currentUser: null,
  isLoading: true,
  error: null,
  success: null,
  isAuthenticated: false,
  userType: null, // 'business' or 'employee'
  permissions: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Authentication actions
    authRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;

      const { user, userType, permissions } = action.payload;

      if (user) {
        state.currentUser = user;
        state.userType = userType || user.role?.type || "business";
        state.permissions = permissions || user.permissions || [];
      }

      state.isAuthenticated = true;
      state.error = null;
    },
    authFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = null;

      // Clear auth state for authentication errors
      const authErrors = [
        "Not authenticated",
        "Unauthorized",
        "Invalid token",
        "Token expired",
        "Access denied",
        "User not authenticated",
      ];

      if (authErrors.some((error) => action.payload?.includes(error))) {
        state.isAuthenticated = false;
        state.currentUser = null;
        state.userType = null;
        state.permissions = [];
      }
    },

    // Profile update actions
    updateProfileRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    updateProfileSuccess: (state, action) => {
      state.isLoading = false;
      if (state.currentUser && action.payload.user) {
        state.currentUser = { ...state.currentUser, ...action.payload.user };
      }
      state.success = action.payload?.message || "Profile updated successfully";
    },
    updateProfileFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = null;
    },

    // Credentials update actions
    credentialsUpdateRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    credentialsUpdateSuccess: (state, action) => {
      state.isLoading = false;
      state.success =
        action.payload?.message || "Credentials updated successfully";
      state.error = null;
    },
    credentialsUpdateFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = null;
    },

    // Logout action
    logoutUser: (state) => {
      state.currentUser = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.success = null;
      state.error = null;
      state.userType = null;
      state.permissions = [];
    },

    // Utility actions
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setAuthentication: (state, action) => {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        state.currentUser = null;
        state.userType = null;
        state.permissions = [];
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearAuthState: (state) => {
      Object.assign(state, initialState);
    },
    updateUserPermissions: (state, action) => {
      state.permissions = action.payload;
      if (state.currentUser) {
        state.currentUser.permissions = action.payload;
      }
    },
  },
});

export const {
  authRequest,
  authSuccess,
  authFail,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFail,
  credentialsUpdateRequest,
  credentialsUpdateSuccess,
  credentialsUpdateFail,
  logoutUser,
  clearError,
  clearSuccess,
  setAuthentication,
  setLoading,
  clearAuthState,
  updateUserPermissions,
} = authSlice.actions;

// Async Actions
export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(authRequest());

    // Client-side validation
    const validation = AuthValidationSchemas.login.safeParse({
      body: credentials,
    });
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(errorMessage);
    }

    // Filter out root user type from client requests
    if (credentials.userType && credentials.userType.toUpperCase() === "ROOT") {
      throw new Error("Invalid user type");
    }

    const { data } = await axios.post(`/auth/login`, credentials);

    if (data?.data?.userType?.toUpperCase() === "ROOT") {
      throw new Error("Access denied");
    }

    dispatch(setAuthentication(true));
    dispatch(authSuccess(data.data));
    toast.success(data.message || "Login successful");
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(setAuthentication(false));
    dispatch(authFail(errMsg));
  }
};

export const logout = () => async (dispatch) => {
  try {
    dispatch(authRequest());
    await axios.post(`/auth/logout`);

    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    toast.success("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    // Still logout locally even if server request fails
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
  }
};

export const refreshToken = () => async (dispatch) => {
  try {
    const { data } = await axios.post(`/auth/refresh`);

    // Prevent root users from authenticating via refresh
    if (data?.data?.userType?.toUpperCase() === "ROOT") {
      throw new Error("Access denied");
    }

    dispatch(setAuthentication(true));
    dispatch(authSuccess(data.data));
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(setAuthentication(false));
    throw error;
  }
};

export const verifyAuth = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axios.get(`/auth/me`);

    // Prevent root users from authenticating
    if (data?.data?.user?.userType?.toUpperCase() === "ROOT") {
      throw new Error("Access denied");
    }

    dispatch(setAuthentication(true));
    dispatch(authSuccess(data.data));
    return data;
  } catch (error) {
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateCredentials =
  (userId, credentialsData) => async (dispatch) => {
    try {
      dispatch(credentialsUpdateRequest());

      // Client-side validation
      const validation = AuthValidationSchemas.updateCredentials.safeParse({
        body: credentialsData,
        params: { userId },
      });

      if (!validation.success) {
        const errorMessage = validation.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(errorMessage);
      }

      const { data } = await axios.put(
        `/auth/${userId}/credentials`,
        credentialsData
      );

      dispatch(credentialsUpdateSuccess(data));
      toast.success(data.message || "Credentials updated successfully");
      return data;
    } catch (error) {
      const errMsg = ZodErrorCatch(error);
      dispatch(credentialsUpdateFail(errMsg));
      throw error;
    }
  };

export const updateProfile = (profileData) => async (dispatch) => {
  try {
    dispatch(updateProfileRequest());

    // Client-side validation
    const validation = AuthValidationSchemas.updateProfile.safeParse({
      body: profileData,
    });
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(errorMessage);
    }

    const { data } = await axios.put(`/auth/profile`, profileData);

    dispatch(updateProfileSuccess(data.data));
    toast.success(data.message || "Profile updated successfully");
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(updateProfileFail(errMsg));
    throw error;
  }
};

export const updateProfileImage = (formData) => async (dispatch) => {
  try {
    dispatch(updateProfileRequest());

    const { data } = await axios.put(`/auth/profile/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    dispatch(updateProfileSuccess(data.data));
    toast.success(data.message || "Profile image updated successfully");
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(updateProfileFail(errMsg));
    throw error;
  }
};

export const passwordReset = (email, userType) => async (dispatch) => {
  try {
    dispatch(authRequest());

    // Client-side validation
    const validation = AuthValidationSchemas.forgotPassword.safeParse({
      body: { email, userType },
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(errorMessage);
    }

    // Prevent root password reset from client
    if (userType && userType.toUpperCase() === "ROOT") {
      throw new Error("Invalid user type");
    }

    const { data } = await axios.post(`/auth/password-reset`, {
      email,
      userType,
    });
    dispatch(authSuccess(data));
    toast.success(data.message || "Password reset email sent");
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(authFail(errMsg));
    throw error;
  }
};

export const verifyPasswordReset = (token, userType) => async (dispatch) => {
  try {
    dispatch(authRequest());

    // Client-side validation
    const validation = AuthValidationSchemas.confirmPasswordReset.safeParse({
      query: { token, type: userType },
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(errorMessage);
    }

    // Prevent root password reset from client
    if (userType && userType.toUpperCase() === "ROOT") {
      throw new Error("Invalid user type");
    }

    const { data } = await axios.get(
      `/auth/verify-password-reset?token=${token}&type=${userType}`
    );
    dispatch(authSuccess(data));
    toast.success(data.message || "Password reset successful");
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(authFail(errMsg));
    throw error;
  }
};

export const verifyEmail = (token) => async (dispatch) => {
  try {
    dispatch(authRequest());

    // Client-side validation
    const validation = AuthValidationSchemas.verifyEmail.safeParse({
      query: { token },
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(errorMessage);
    }

    const { data } = await axios.get(`/auth/verify-email?token=${token}`);
    dispatch(authSuccess(data));
    toast.success(data.message || "Email verified successfully");
    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(authFail(errMsg));
    throw error;
  }
};

// Selectors for better state access
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectUserPermissions = (state) => state.auth.permissions;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthSuccess = (state) => state.auth.success;
export const selectUserType = (state) => state.auth.userType;
export const selectIsEmployee = (state) => state.auth.userType === "employee";
export const selectIsBusiness = (state) => state.auth.userType === "business";

export default authSlice.reducer;
