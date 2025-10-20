import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  commissionSettings: [],
  commissionEarnings: [],
  isLoading: false,
  error: null,
  success: null,
};

const commissionSlice = createSlice({
  name: "commission",
  initialState,
  reducers: {
    commissionRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    commissionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
      if (action.payload?.message) toast.success(action.payload.message);
    },
    commissionFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    setCommissionSettings: (state, action) => {
      state.isLoading = false;
      state.commissionSettings = action.payload?.data || action.payload;
    },
    setCommissionEarnings: (state, action) => {
      state.isLoading = false;
      state.commissionEarnings = action.payload?.data || action.payload;
    },
    resetCommission: (state) => {
      state.commissionSettings = [];
      state.commissionEarnings = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  commissionRequest,
  commissionSuccess,
  commissionFail,
  setCommissionSettings,
  setCommissionEarnings,
  resetCommission,
} = commissionSlice.actions;

// ---------------- Commission Setting Actions ------------------

// Create or update commission setting
export const createOrUpdateCommissionSetting =
  (payload) => async (dispatch) => {
    try {
      dispatch(commissionRequest());
      const { data } = await axios.post(`/api/v1/commissions/setting`, payload);
      dispatch(commissionSuccess(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(commissionFail(errMsg));
      throw error;
    }
  };

// Get commission settings by role or user
export const getCommissionSettingsByRoleOrUser =
  (roleId, userId = null) =>
  async (dispatch) => {
    try {
      dispatch(commissionRequest());
      const params = userId ? { userId } : {};
      const { data } = await axios.get(
        `/api/v1/commissions/setting/${roleId}`,
        { params }
      );
      dispatch(setCommissionSettings(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(commissionFail(errMsg));
      throw error;
    }
  };

// ---------------- Commission Earning Actions ------------------

// Create commission earning
export const createCommissionEarning = (payload) => async (dispatch) => {
  try {
    dispatch(commissionRequest());
    const { data } = await axios.post(`/api/v1/commissions/earn`, payload);
    dispatch(commissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(commissionFail(errMsg));
    throw error;
  }
};

// Get all commission earnings with optional filters
export const getCommissionEarnings =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(commissionRequest());
      const { data } = await axios.get(`/api/v1/commissions`, {
        params: filters,
      });
      dispatch(setCommissionEarnings(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(commissionFail(errMsg));
      throw error;
    }
  };

export default commissionSlice.reducer;
