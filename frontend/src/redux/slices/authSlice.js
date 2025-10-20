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
} = authSlice.actions;

export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/login`, credentials);

    // Cookies automatically set by backend (httpOnly + secure)
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

    // Cookies automatically cleared by backend
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message || error?.message || "Logout failed";
    // Even if API call fails, clear local state
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    dispatch(authFail(errMsg));
    throw new Error(errMsg);
  }
};

export const refreshToken = () => async (dispatch) => {
  try {
    const { data } = await axios.post(`/auth/refresh`);

    // New tokens automatically set in cookies by backend
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
    dispatch(authSuccess(data)); // Changed from updateUser to authSuccess
    return data;
  } catch (error) {
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    throw new Error("Not authenticated");
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateCredentials =
  (userId, credentialsData) => async (dispatch) => {
    try {
      dispatch(authRequest());
      const { data } = await axios.put(
        `/auth/${userId}/credentials`,
        credentialsData
      );

      // If password changed, user might be logged out
      if (credentialsData.newPassword) {
        dispatch(setAuthentication(false));
      }

      dispatch(authSuccess(data));
      toast.success(data.message);
      return data;
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
