import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

// Axios setup
axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

// Initial state
const initialState = {
  permissions: [],
  currentPermission: null,
  isLoading: false,
  error: null,
  success: null,
};

const permissionSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    permissionRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    permissionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    permissionFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    clearPermissionError: (state) => {
      state.error = null;
    },
    clearPermissionSuccess: (state) => {
      state.success = null;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setCurrentPermission: (state, action) => {
      state.currentPermission = action.payload;
    },
    addPermission: (state, action) => {
      state.permissions.push(action.payload);
    },
    updatePermissionInList: (state, action) => {
      const updated = action.payload;
      const index = state.permissions.findIndex((p) => p.id === updated.id);
      if (index !== -1) {
        state.permissions[index] = updated;
      }
    },
    removePermissionFromList: (state, action) => {
      const id = action.payload;
      state.permissions = state.permissions.filter((p) => p.id !== id);
    },
  },
});

export const {
  permissionRequest,
  permissionSuccess,
  permissionFail,
  clearPermissionError,
  clearPermissionSuccess,
  setPermissions,
  setCurrentPermission,
  addPermission,
  updatePermissionInList,
  removePermissionFromList,
} = permissionSlice.actions;

export const getAllPermissions = () => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.get(`/permissions`);
    dispatch(setPermissions(data.data.permissions || []));
    dispatch(permissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch permissions";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

export const getPermissionById = (userId) => async (dispatch) => {
     console.log(userId);
   
  try {
    dispatch(permissionRequest());
    const { data } = await axios.get(`permissions/user-permission/${userId}`);
    dispatch(setCurrentPermission(data.data));
    dispatch(permissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

export const upsertPermission =
  (permissionData, entityType) => async (dispatch) => {
    try {
      dispatch(permissionRequest());
      const { data } = await axios.post(
        `permissions/${entityType}`,
        permissionData
      );
      dispatch(addPermission(data.data));
      dispatch(permissionSuccess(data));
      toast.success(data.message);
      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create permission";
      dispatch(permissionFail(errMsg));
      throw new Error(errMsg);
    }
  };

export const updatePermission = (id, permissionData) => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.put(`/permissions/${id}`, permissionData);
    dispatch(updatePermissionInList(data.data));
    dispatch(permissionSuccess(data));
    toast.success(data.message || "Permission updated successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

export const deletePermission = (id) => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.delete(`/permissions/${id}`);
    dispatch(removePermissionFromList(id));
    dispatch(permissionSuccess(data));
    toast.success(data.message || "Permission deleted successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

export default permissionSlice.reducer;
