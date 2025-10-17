import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  roles: [],
  isLoading: false,
  error: null,
  success: null,
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    roleRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    roleSuccess: (state, action) => {
      state.isLoading = false;
      const roles = action.payload?.data || action.payload;
      state.roles = roles;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    roleFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(state.error);
    },
    resetRole: (state) => {
      state.roles = [];
      state.isLoading = false;
      state.success = null;
      state.error = null;
    },
  },
});

export const { roleRequest, roleSuccess, roleFail, resetRole } =
  roleSlice.actions;

// ---------------- API Actions ------------------

// Create a new role
export const createRole = (rolePayload) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.post("roles/create", rolePayload);
    dispatch(roleSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(roleFail(errMsg));
  }
};

// Get all roles
export const getAllRoles = () => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.get("roles");
    dispatch(roleSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(roleFail(errMsg));
  }
};

// Update a role
export const updateRoleById = (roleId, rolePayload) => async (dispatch) => {
  console.log(roleId, rolePayload);

  try {
    dispatch(roleRequest());
    const { data } = await axios.put(`roles/${roleId}`, rolePayload);
    dispatch(roleSuccess(data));
    toast.success(data.message || "Role updated successfully!");
    dispatch(getAllRoles());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(roleFail(errMsg));
  }
};

// Delete a role
export const deleteRoleById = (roleId) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.delete(`roles/${roleId}`);
    dispatch(roleSuccess(data));
    toast.success(data.message || "Role deleted successfully!");
    dispatch(getAllRoles());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(roleFail(errMsg));
  }
};

export default roleSlice.reducer;
