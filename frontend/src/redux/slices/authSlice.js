import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const storedUser = sessionStorage.getItem("currentUser");

const initialState = {
  currentUser: storedUser ? JSON.parse(storedUser) : null,
  isLoading: false,
  error: null,
  success: null,
  isAuthenticated: !!storedUser,
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
      const userData = action.payload?.data || action.payload;
      state.currentUser = userData;
      state.success = action.payload?.message || null;
      state.error = null;
      state.isAuthenticated = true;

      sessionStorage.setItem("currentUser", JSON.stringify(userData));
    },
    authFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      if (action.payload) toast.error(state.error);
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.success = null;
      state.error = null;
      sessionStorage.removeItem("currentUser");
    },
  },
});

export const { authRequest, authSuccess, authFail, logoutUser } =
  authSlice.actions;

// ---------------- API Actions ------------------

export const registation = (userData) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/register`, userData);
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(authFail(errMsg));
  }
};

export const pri = (userData) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/register`, userData);
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(authFail(errMsg));
  }
};

export const verifysignup = (token) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/signup-verify?token=${token}`);
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(authFail(errMsg));
  }
};

export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/login`, credentials);
    dispatch(authSuccess(data));
    toast.success(data.message);
    return data; // unwrap() will return this
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(authFail(errMsg));
    throw new Error(errMsg); // <-- important for handleLogin try/catch
  }
};

export const getCurrentUser = () => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.get(`/auth/me`);
    dispatch(authSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(authFail(errMsg));
  }
};

export const logout = () => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/logout`);
    dispatch(logoutUser());
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(authFail(errMsg));
    return { message: errMsg };
  }
};

export default authSlice.reducer;
