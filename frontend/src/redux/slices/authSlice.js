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
      state.isAuthenticated = false;
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
    updateCredentialsSuccess: (state, action) => {
      state.isLoading = false;
      state.success =
        action.payload?.message || "Credentials updated successfully";
      state.error = null;
    },
  },
});

export const {
  authRequest,
  authSuccess,
  authFail,
  logoutUser,
  clearError,
  clearSuccess,
  updateUser,
  setAuthentication,
  setLoading,
  clearAuthState,
  updateCredentialsSuccess,
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
    throw new Error(errMsg);
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
    throw new Error(errMsg);
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
    throw new Error(errMsg);
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
    throw new Error("Not authenticated");
  } finally {
    dispatch(setLoading(false));
  }
};

// FIXED: createAsyncThunk removed - using regular async action
export const updateCredentials =
  ({ userId, credentialsData, currentUserId }) =>
  async (dispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await axios.put(
        `/auth/${userId}/credentials`,
        credentialsData
      );

      const isUpdatingOwnAccount = userId === currentUserId;

      if (credentialsData.newPassword && isUpdatingOwnAccount) {
        // User updated their own password - logout
        dispatch(clearAuthState());
        toast.success("Password updated successfully. Please login again.");

        // Redirect to login page after delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);

        return { ...data, logout: true };
      } else {
        // Admin updated someone else's password - update state
        dispatch(updateCredentialsSuccess(data));
        toast.success(data.message);
        return { ...data, logout: false };
      }
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Credentials update failed";
      dispatch(authFail(errMsg));
      throw new Error(errMsg);
    }
  };

export const forgotPassword = (email) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/forgot-password`, { email });
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset failed";
    dispatch(authFail(errMsg));
    throw new Error(errMsg);
  }
};

export const resetPassword = (token, newPassword) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/reset-password`, {
      token,
      newPassword,
    });
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset failed";
    dispatch(authFail(errMsg));
    throw new Error(errMsg);
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
    throw new Error(errMsg);
  }
};

export default authSlice.reducer;
