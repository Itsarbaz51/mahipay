import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  logsList: null,
  logDetail: null,
  loading: false,
  error: null,
  success: null,
};

const loginLogsSlice = createSlice({
  name: "loginLogs",
  initialState,
  reducers: {
    logsRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.success = null;
    },
    logsListSuccess: (state, action) => {
      state.loading = false;
      state.logsList = action.payload;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    logDetailSuccess: (state, action) => {
      state.loading = false;
      state.logDetail = action.payload?.data || null;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    logsFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    resetLogs: (state) => {
      state.loading = false;
      state.error = null;
      state.success = null;
      state.logDetail = null;
    },
  },
});

export const {
  logsRequest,
  logsListSuccess,
  logDetailSuccess,
  logsFail,
  resetLogs,
} = loginLogsSlice.actions;

export default loginLogsSlice.reducer;

// ------------------ Fetch all login logs (admin) --------------------------
export const getLoginLogs =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(logsRequest());

      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || "",
        deviceType: params.deviceType || "all", // YEH LINE FIX KAREN
        roleId: params.roleId || "",
        sort: params.sort || "desc",
        sortBy: params.sortBy || "createdAt",
        userId: params.userId || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        browser: params.browser || undefined,
        os: params.os || undefined,
      };

      // Remove undefined values but keep empty strings for roleId
      Object.keys(requestBody).forEach((key) => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });

      console.log("=== FINAL REQUEST BODY ===");
      console.log(requestBody);

      const { data } = await axios.post("/login-logs", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      dispatch(logsListSuccess(data));
      return data;
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch login logs";
      dispatch(logsFail(errMsg));
      throw error;
    }
  };

// ------------------ Fetch a single login log by ID --------------------------
export const getLoginLogById = (id) => async (dispatch) => {
  try {
    dispatch(logsRequest());
    const { data } = await axios.get(`/api/logs/login-log-detail/${id}`);
    dispatch(logDetailSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(logsFail(errMsg));
  }
};
