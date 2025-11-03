import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  serviceProviders: [],
  currentServiceProvider: null,
  isLoading: false,
  error: null,
  success: null,
};

const serviceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    serviceRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    serviceSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
      if (action.payload?.message) toast.success(action.payload.message);
    },
    serviceFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    setServiceProviders: (state, action) => {
      state.isLoading = false;
      state.serviceProviders = action.payload?.data || action.payload;
    },
    setCurrentServiceProvider: (state, action) => {
      state.isLoading = false;
      state.currentServiceProvider = action.payload?.data || action.payload;
    },
    addServiceProvider: (state, action) => {
      state.serviceProviders.unshift(action.payload?.data || action.payload);
    },
    updateServiceProviderInList: (state, action) => {
      const updatedService = action.payload?.data || action.payload;
      const index = state.serviceProviders.findIndex(
        (service) => service.id === updatedService.id
      );
      if (index !== -1) {
        state.serviceProviders[index] = updatedService;
      }
    },
    removeServiceProvider: (state, action) => {
      state.serviceProviders = state.serviceProviders.filter(
        (service) => service.id !== action.payload
      );
    },
    resetService: (state) => {
      state.serviceProviders = [];
      state.currentServiceProvider = null;
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  serviceRequest,
  serviceSuccess,
  serviceFail,
  setServiceProviders,
  setCurrentServiceProvider,
  addServiceProvider,
  updateServiceProviderInList,
  removeServiceProvider,
  resetService,
} = serviceSlice.actions;

// Get all service providers created by current user
export const allServices = () => async (dispatch) => {
  try {
    dispatch(serviceRequest());
    const { data } = await axios.get(`/services/lists`);
    dispatch(setServiceProviders(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

export const getServicesActive = () => async (dispatch) => {
  try {
    dispatch(serviceRequest());
    const { data } = await axios.get(`/services/providers/status`);
    dispatch(setServiceProviders(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

// Get service provider by ID
export const getServiceProviderById = (id) => async (dispatch) => {
  try {
    dispatch(serviceRequest());
    const { data } = await axios.get(`/services/providers/${id}`);
    dispatch(setCurrentServiceProvider(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

// Toggle active status change active status
export const toggleServiceProviderStatus =
  (id, isActive) => async (dispatch) => {
    try {
      dispatch(serviceRequest());
      const { data } = await axios.patch(`/services/providers/${id}/status`, {
        isActive,
      });
      dispatch(serviceSuccess(data));
      dispatch(updateServiceProviderInList(data));

      // Also update current service provider if it's the one being updated
      dispatch(setCurrentServiceProvider(data));

      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(serviceFail(errMsg));
      throw error;
    }
  };

export default serviceSlice.reducer;
