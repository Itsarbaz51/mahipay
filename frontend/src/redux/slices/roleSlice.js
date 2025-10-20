import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

// Configure axios
axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  roles: [],
  currentRole: null,
  isLoading: false,
  error: null,
  success: null,
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    roleRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    roleSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    roleFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) {
        toast.error(action.payload);
      }
    },
    clearRoleError: (state) => {
      state.error = null;
    },
    clearRoleSuccess: (state) => {
      state.success = null;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setCurrentRole: (state, action) => {
      state.currentRole = action.payload;
    },
    addRole: (state, action) => {
      state.roles.push(action.payload);
    },
    updateRoleInList: (state, action) => {
      const updatedRole = action.payload;
      const index = state.roles.findIndex((role) => role.id === updatedRole.id);
      if (index !== -1) {
        state.roles[index] = updatedRole;
      }
    },
    removeRoleFromList: (state, action) => {
      const roleId = action.payload;
      state.roles = state.roles.filter((role) => role.id !== roleId);
    },
  },
});

export const {
  roleRequest,
  roleSuccess,
  roleFail,
  clearRoleError,
  clearRoleSuccess,
  setRoles,
  setCurrentRole,
  addRole,
  updateRoleInList,
  removeRoleFromList,
} = roleSlice.actions;

// Async action creators

/**
 * Get all roles (with optional filtering based on current user's role level)
 */
export const getAllRoles = () => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.get(`/roles`);
    dispatch(setRoles(data.data.roles || []));
    dispatch(roleSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch roles";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

/**
 * Get role by ID (only for SUPER ADMIN)
 */
export const getRoleById = (roleId) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.get(`/roles/${roleId}`);
    dispatch(setCurrentRole(data.data));
    dispatch(roleSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

/**
 * Create new role (only for ADMIN)
 */
export const createRole = (roleData) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.post(`/roles/create`, roleData);
    dispatch(addRole(data.data));
    dispatch(roleSuccess(data));
    toast.success(data.message || "Role created successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

/**
 * Update role (only for ADMIN)
 */
export const updateRole = (roleId, roleData) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.put(`/roles/${roleId}`, roleData);
    dispatch(updateRoleInList(data.data));
    dispatch(roleSuccess(data));
    toast.success(data.message || "Role updated successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

/**
 * Delete role (only for ADMIN)
 */
export const deleteRole = (roleId) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.delete(`/roles/${roleId}`);
    dispatch(removeRoleFromList(roleId));
    dispatch(roleSuccess(data));
    toast.success(data.message || "Role deleted successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

export default roleSlice.reducer;
