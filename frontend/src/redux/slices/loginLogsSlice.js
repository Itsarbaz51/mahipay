import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  logsList: [],
  logDetail: null,
  isLoading: false,
  error: null,
  success: null,
};

const loginLogsSlice = createSlice({
  name: "loginLogs",
  initialState,
  reducers: {
    logsRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    logsListSuccess: (state, action) => {
      state.isLoading = false;
      state.logsList = action.payload?.data || [];
      state.success = action.payload?.message || null;
      state.error = null;
    },
    logDetailSuccess: (state, action) => {
      state.isLoading = false;
      state.logDetail = action.payload?.data || null;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    logsFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    resetLogs: (state) => {
      state.isLoading = false;
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
      const body = {
        userId: params.userId || null,
        page: params.page || 1,
        limit: params.limit || 10,
        sort: params.sort || "desc",
        search: params.search || "",
      };

      const { data } = await axios.post("/login-logs", body);
      dispatch(logsListSuccess(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(logsFail(errMsg));
    }
  };

// ------------------ Fetch a single login log by ID --------------------------
export const getLoginLogById = (id) => async (dispatch) => {
  try {
    dispatch(logsRequest());
    const { data } = await axios.get(`logs/login-log-detail/${id}`);
    dispatch(logDetailSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(logsFail(errMsg));
  }
};

// ------------------ Optional: Delete a specific login log --------------------------
export const deleteLoginLog = (id) => async (dispatch) => {
  try {
    dispatch(logsRequest());
    const { data } = await axios.delete(`logs/delete-login-log/${id}`);
    toast.success(data.message || "Login log deleted successfully");
    dispatch(getLoginLogs());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(logsFail(errMsg));
    toast.error(errMsg);
  }
};
