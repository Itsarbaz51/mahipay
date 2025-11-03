import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  currentUser: null,
  isLoading: true,
  error: null,
  success: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;
      const userData = action.payload?.user || action.payload?.data?.user;

      if (userData) {
        state.currentUser = userData;
      }

      state.success =
        action.payload?.message || action.payload?.data?.message || null;
      state.error = null;
      state.isAuthenticated = true;
    },
    authFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;

      const logoutErrors = [
        "Not authenticated",
        "Unauthorized",
        "Invalid token",
        "Token expired",
        "Access denied",
      ];

      if (
        logoutErrors.some((logoutError) =>
          action.payload?.includes(logoutError)
        )
      ) {
        // Real auth error → logout user
        state.isAuthenticated = false;
        state.currentUser = null;
      } else {
        // Stay logged in for normal business logic errors
        state.isAuthenticated = true;
      }

      if (action.payload) {
        toast.error(action.payload);
      }
    },
    // ✅ CREDENTIAL UPDATE SPECIFIC REDUCERS
    credentialsUpdateRequest: (state) => {
      // Don't set isLoading=true for credential updates
      state.error = null;
      state.success = null;
    },
    credentialsUpdateSuccess: (state, action) => {
      state.success =
        action.payload?.message || "Credentials updated successfully";
      state.error = null;
      // Don't touch isLoading or isAuthenticated
    },
    credentialsUpdateFail: (state, action) => {
      state.error = action.payload;
      state.success = null;
      // Don't touch isLoading or isAuthenticated

      if (action.payload) {
        toast.error(action.payload);
      }
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.success = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    updateUser: (state, action) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    setAuthentication: (state, action) => {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        state.currentUser = null;
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearAuthState: (state) => {
      state.currentUser = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.success = null;
      state.error = null;
    },
  },
});

export const {
  authRequest,
  authSuccess,
  authFail,
  credentialsUpdateRequest, // ✅ NEW
  credentialsUpdateSuccess, // ✅ NEW
  credentialsUpdateFail,
  logoutUser,
  clearError,
  clearSuccess,
  updateUser,
  setAuthentication,
  setLoading,
  clearAuthState,
} = authSlice.actions;

// Async Actions
export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/login`, credentials);

    dispatch(setAuthentication(true));
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message || error?.message || "Login failed";
    dispatch(setAuthentication(false));
    dispatch(authFail(errMsg));
  }
};

export const logout = () => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/logout`);

    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message || error?.message || "Logout failed";
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    dispatch(authFail(errMsg));
  }
};

export const refreshToken = () => async (dispatch) => {
  try {
    const { data } = await axios.post(`/auth/refresh`);

    dispatch(setAuthentication(true));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Token refresh failed";
    dispatch(setAuthentication(false));
  }
};

export const verifyAuth = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axios.get(`/users/me`);
    dispatch(setAuthentication(true));
    dispatch(authSuccess(data));
    return data;
  } catch (error) {
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
  } finally {
    dispatch(setLoading(false));
  }
};

// ✅ FIXED: updateCredentials - No authRequest, only credential specific actions
export const updateCredentials =
  ({ userId, credentialsData, currentUserId }) =>
  async (dispatch) => {
    try {
      // ✅ Use credentialsUpdateRequest instead of authRequest
      dispatch(credentialsUpdateRequest());

      const { data } = await axios.put(
        `/auth/${userId}/credentials`,
        credentialsData
      );

      const isUpdatingOwnAccount = userId === currentUserId;

      if (credentialsData.newPassword && isUpdatingOwnAccount) {
        // ✅ User updated own password → stay logged in
        toast.success("Password updated successfully!");
        dispatch(credentialsUpdateSuccess(data));
        return { ...data, logout: false };
      } else {
        // ✅ Admin updated someone else's password
        dispatch(credentialsUpdateSuccess(data));
        toast.success(data.message);
        return { ...data, logout: false };
      }
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Credentials update failed";

      // ✅ Use credentialsUpdateFail instead of authFail
      dispatch(credentialsUpdateFail(errMsg));
    }
  };

export const passwordReset = (email) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/password-reset`, { email });
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset failed";
    dispatch(authFail(errMsg));
  }
};

export const verifyPasswordReset = (token) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.get(
      `/auth/verify-password-reset?token=${token}`
    );
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset failed";
    dispatch(authFail(errMsg));
  }
};

export const verifyEmail = (token) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.get(`/auth/verify-email?token=${token}`);
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Email verification failed";
    dispatch(authFail(errMsg));
  }
};

export default authSlice.reducer;
