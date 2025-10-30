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
import TransactionHistory from "../components/tabels/TransactionHistory.jsx";
import Reports from "../pages/Reports";
import ProfileKYC from "../components/tabels/ProfileKYC";
import PayoutTable from "../components/tabels/PayoutTable";
import EmployeeTable from "../components/tabels/EmployeeTable";
import MembersTable from "../components/tabels/MembersTable";
import WalletTable from "../components/tabels/Wallet";
import AddProfileKYC from "../components/forms/AddProfileKYC";
import Settings from "../components/Settings";
import CommissionManagement from "../pages/CommissionManagement";
import CardPayout from "../pages/services/CardPayout";
import UserProfilePage from "../pages/view/UserProfilePage ";
import AuditLogs from "../pages/AuditLogs";
import LoginLogs from "../pages/LoginLogs.jsx";
import PrivacyPolicy from "../pages/landing/Privacypolicy";
import TermsConditions from "../pages/landing/Terms&conditions";
import BanksTable from "../components/tabels/BanksTable.jsx";
import UnauthorizedPage from "../pages/UnauthorizedPage.jsx";
import FundRequestTable from "../components/tabels/FundRequestTable.jsx";

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
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-conditions" element={<TermsConditions />} />
        </Route>

        {/* ---------------- PROTECTED ROUTES WITH MAIN LAYOUT ---------------- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="payout" element={<PayoutTable />} />
          <Route path="commission" element={<CommissionManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="request-fund" element={<FundRequestTable />} />
          <Route path="all-kyc" element={<ProfileKYC />} />
          <Route path="members" element={<MembersTable />} />
          <Route path="settings" element={<Settings />} />
          <Route path="employee-management" element={<EmployeeTable />} />
          <Route path="wallet" element={<WalletTable />} />
          <Route path="card-payout" element={<CardPayout />} />
          <Route path="profile/:id" element={<UserProfilePage />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="login-logs" element={<LoginLogs />} />
          <Route path="bank-details" element={<BanksTable />} />

          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* ---------------- STANDALONE PROTECTED ROUTES ---------------- */}
        <Route
          path="kyc-submit"
          element={
            <ProtectedRoute>
              <AddProfileKYC />
            </ProtectedRoute>
          }
        />

        <Route
          path="unauthorized"
          element={
            <ProtectedRoute>
              <UnauthorizedPage />
            </ProtectedRoute>
          }
        />

        {/* ---------------- 404 / FALLBACK ---------------- */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </>
    )
  );
};
