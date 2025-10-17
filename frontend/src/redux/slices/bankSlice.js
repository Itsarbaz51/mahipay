import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  bankData: [],
  isLoading: false,
  error: null,
  success: null,
  isBankVerified: false,
};

const bankSlice = createSlice({
  name: "bank",
  initialState,
  reducers: {
    bankRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    bankSuccess: (state, action) => {
      state.isLoading = false;
      const bankData = action.payload?.data || action.payload;
      state.bankData = bankData;
      state.success = action.payload?.message || null;
      state.error = null;
      state.isBankVerified = bankData?.status === "verified";
    },
    bankFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(state.error);
    },
    resetBank: (state) => {
      state.bankData = null;
      state.isLoading = false;
      state.isBankVerified = false;
      state.success = null;
      state.error = null;
    },
  },
});

export const { bankRequest, bankSuccess, bankFail, resetBank } =
  bankSlice.actions;

// ---------------- API Actions ------------------

// submit Bank details
export const addBank = (bankPayload) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.post(`/bank/add-bank`, bankPayload);
    dispatch(bankSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// get all Bank details (admin use)
export const getAllBanks = () => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.get(`/bank/get-all`);
    dispatch(bankSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// verify Bank details (admin use)
export const verifyBank = (bankId, status) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.put(`/bank/verify/${bankId}`, { status });
    dispatch(bankSuccess(data));
    dispatch(getAllBanks());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// delete Bank details (admin use)
export const deleteBank = (bankId) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.delete(`/bank/delete/${bankId}`);
    dispatch(bankSuccess(data));
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

export const getAdminBank = () => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.get(`/bank/get-admin-bank`);
    dispatch(bankSuccess(data));
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

export const addBankWithVerify = (bankData) => async (dispatch) => {
  try {
    dispatch(bankRequest());

    const { data } = await axios.post(`/payout/verify-add-bank`, bankData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    dispatch(bankSuccess(data));
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

export default bankSlice.reducer;
