import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  success: null,
};
const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    usersRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    usersSuccess: (state, action) => {
      state.isLoading = false;
      state.users = action.payload?.data || action.payload;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    updateUserSuccess: (state, action) => {
      state.isLoading = false;
      const updatedUser = action.payload?.data || action.payload;
      state.users = state.users.map((u) =>
        u.id === updatedUser.id ? updatedUser : u
      );
    },
    userSelect: (state, action) => {
      state.selectedUser = action.payload;
    },
    usersFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(state.error);
    },
    resetUsers: (state) => {
      state.users = [];
      state.selectedUser = null;
      state.isLoading = false;
      state.success = null;
      state.error = null;
    },
  },
});

export const {
  usersRequest,
  usersSuccess,
  usersFail,
  userSelect,
  resetUsers,
  updateUserSuccess,
} = usersSlice.actions;

// ---------------- API Actions ------------------

// get all users
export const getAllUsers =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(usersRequest());

      const body = {
        page: params.page || 1,
        limit: params.limit || 10,
        sort: params.sort || "desc",
        status: params.status || "ALL",
      };

      const { data } = await axios.post(`users`, body);

      dispatch(usersSuccess(data?.data?.users || []));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error.message;
      dispatch(usersFail(errMsg));
    }
  };

// update user status
export const updateUserStates = (id, userData) => async (dispatch) => {
  try {
    dispatch(usersRequest());
    const { data } = await axios.patch(
      `/users/user-status-update/${id}`,
      userData
    );
    dispatch(usersSuccess(data));
    dispatch(getAllUsers());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(usersFail(errMsg));
  }
};

// get single user
export const getUserById = (userId) => async (dispatch) => {
  try {
    dispatch(usersRequest());
    const { data } = await axios.get(`users/${userId}`);
    dispatch(userSelect(data));
    dispatch(getAllUsers());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(usersFail(errMsg));
  }
};

// create user
export const createUser = (userData) => async (dispatch) => {
  try {
    dispatch(usersRequest());
    const { data } = await axios.post("auth/register", userData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(usersSuccess(data));
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(usersFail(errMsg));
    throw error;
  }
};

// update user
export const updateUser = (userId, userPayload) => async (dispatch) => {
  try {
    dispatch(usersRequest());
    const { data } = await axios.put(`/users/update/${userId}`, userPayload);
    toast.success("User updated successfully!");
    dispatch(getAllUsers());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(usersFail(errMsg));
  }
};

// delete user
export const deleteUser = (userId) => async (dispatch) => {
  try {
    dispatch(usersRequest());
    const { data } = await axios.delete(`/users/delete/${userId}`);
    toast.success("User deleted successfully!");
    dispatch(getAllUsers());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(usersFail(errMsg));
  }
};

export default usersSlice.reducer;
