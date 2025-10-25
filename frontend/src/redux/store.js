import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import kycReducer from "./slices/kycSlice.js";
import userReducer from "./slices/userSlice.js";
import bankReducer from "./slices/bankSlice.js";
import walletReducer from "./slices/walletSlice.js";
import commissionReducer from "./slices/commissionSlice.js";
import roleReducer from "./slices/roleSlice.js";
import AddressReducer from "./slices/addressSlice.js";
import serviceReducer from "./slices/serviceSlice.js";
import permissionReducer from "./slices/permissionSlice.js";
import loginLogsReducer from "./slices/loginLogsSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    kyc: kycReducer,
    address: AddressReducer,
    users: userReducer,
    bank: bankReducer,
    wallet: walletReducer,
    roles: roleReducer,
    commission: commissionReducer,
    services: serviceReducer,
    permission: permissionReducer,
    logs: loginLogsReducer,
  },
});

export default store;
