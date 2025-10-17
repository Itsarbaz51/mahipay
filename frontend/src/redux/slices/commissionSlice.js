import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  commissions: [],
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
      if (action.payload) toast.error(state.error);
      state.error = null;
    },
    setCommissions: (state, action) => {
      state.isLoading = false;
      state.commissions = action.payload?.data || action.payload;
    },
    resetCommission: (state) => {
      state.commissions = [];
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
  setCommissions,
  resetCommission,
} = commissionSlice.actions;

// ---------------- API Actions ------------------

// Add commission
export const addCommission = (payload) => async (dispatch) => {
  try {
    dispatch(commissionRequest());
    const { data } = await axios.post(`/commission/add-commission`, payload);
    dispatch(commissionSuccess(data));
    // dispatch(getRoleCommission(payload.role));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(commissionFail(errMsg));
    throw error;
  }
};

// Get commission by userId
export const getUserCommissions = (userId) => async (dispatch) => {
  try {
    dispatch(commissionRequest());
    const { data } = await axios.get(
      `/commission/get-user-commissions/${userId}`
    );
    dispatch(setCommissions(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(commissionFail(errMsg));
  }
};

// Get commission by role
export const getRoleCommission = (role) => async (dispatch) => {
  try {
    dispatch(commissionRequest());
    const { data } = await axios.get(`/commission/role/${role}`);
    dispatch(setCommissions(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(commissionFail(errMsg));
  }
};

// Update commission
export const updateCommission = (id, payload) => async (dispatch) => {
  try {
    dispatch(commissionRequest());
    const { data } = await axios.put(
      `/commission/update-commission/${id}`,
      payload
    );
    dispatch(commissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(commissionFail(errMsg));
  }
};

// Delete commission
export const deleteCommission = (id) => async (dispatch) => {
  console.log(id);

  try {
    dispatch(commissionRequest());
    const { data } = await axios.delete(`/commission/delete-commissions/${id}`);
    dispatch(commissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(commissionFail(errMsg));
  }
};

export default commissionSlice.reducer;
