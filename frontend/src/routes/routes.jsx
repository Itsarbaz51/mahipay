import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import PublicLayout from "../layouts/PublicLayout";

// 🔹 Public Pages
import Home from "../pages/landing/Home";
import About from "../pages/landing/About";
import Contact from "../pages/landing/Contact";
import Login from "../pages/auth/Login";

// 🔹 Protected Pages
import Dashboard from "../pages/Dashboard";
import TransactionHistory from "../pages/TransactionHistory";
import Reports from "../pages/Reports";
import CommissionCharges from "../pages/CommissionManagement";

import AllKycTable from "../components/tabels/AllKycTable";
import PayoutTable from "../components/tabels/PayoutTable";
import EmployeeTable from "../components/tabels/EmployeeTable";
import MembersTable from "../components/tabels/MembersTable";
import WalletTable from "../components/tabels/Wallet";
import KYCVerification from "../components/forms/KYCForm";
import AddFundRequest from "../components/forms/AddFundRequest";
import Settings from "../components/Settings";

export const createRouter = () => {
  return createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* ---------------- PROTECTED ROUTES ---------------- */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="payout" element={<PayoutTable />} />
          <Route path="commission" element={<CommissionCharges />} />
          <Route path="reports" element={<Reports />} />
          <Route path="add-fund" element={<AddFundRequest />} />
          <Route path="all-kyc" element={<AllKycTable />} />
          <Route path="members" element={<MembersTable />} />
          <Route path="settings" element={<Settings />} />
          <Route path="employee-management" element={<EmployeeTable />} />
          <Route path="wallet" element={<WalletTable />} />
        </Route>

        <Route
          path="kyc-submit"
          element={
            <ProtectedRoute>
              <KYCVerification />
            </ProtectedRoute>
          }
        />

        {/* ---------------- 404 / FALLBACK ---------------- */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </>
    )
  );
};
