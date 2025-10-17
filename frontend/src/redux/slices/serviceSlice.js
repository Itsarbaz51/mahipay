import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  serviceData: [],
  isLoading: false,
  error: null,
  success: null,
  isBankVerified: false,
};

const serviceSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    serviceRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    serviceSuccess: (state, action) => {
      state.isLoading = false;
      state.serviceData = action.payload?.data || action.payload;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    serviceFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(state.error);
    },
  },
});

export const { serviceRequest, serviceSuccess, serviceFail } =
  serviceSlice.actions;

// ---------------- API Actions ------------------

// ---------------- payout and bank verify -----------------
export const addBankWithVerify = (Data) => async (dispatch) => {
  try {
    dispatch(serviceRequest());
    const { data } = await axios.post(`/payout/verify-add-bank`, Data);
    dispatch(serviceSuccess(data));
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(serviceFail(errMsg));
  }
};

export default serviceSlice.reducer;
