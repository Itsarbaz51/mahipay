import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  ArrowLeft,
  Users,
  Eye,
  EyeOff,
  TrendingUp,
  Lock,
  X,
  Wallet,
} from "lucide-react";

export default function UserProfileView({ userData, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showTransactionPin, setShowTransactionPin] = useState(false);

  // Handle different response structures
  const user = userData?.data?.user || userData?.user || userData;

  console.log("UserProfileView - userData:", userData);
  console.log("UserProfileView - extracted user:", user);

  // --- Error State (No Change) ---
  if (!user || !user.id) {
    return (
      <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-6">Unable to load user data.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // --- Utility Functions (No Change) ---
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Status Badge Component (No Change) ---
  const StatusBadge = ({ status }) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-700 border-green-300",
      INACTIVE: "bg-red-100 text-red-700 border-red-300",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
      IN_ACTIVE: "bg-red-100 text-red-700 border-red-300",
    };
    const label = status === "IN_ACTIVE" ? "Inactive" : status;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${
          colors[status] || colors.PENDING
        }`}
      >
        {status === "ACTIVE" ? (
          <CheckCircle size={14} />
        ) : (
          <XCircle size={14} />
        )}
        {label}
      </span>
    );
  };

  // Professional Card Style
  const detailCard = "bg-white rounded-xl shadow-md border border-gray-100 p-6 w-full";
  const sectionTitleClass = "text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2";

  // --- Main Pop-up Structure ---
  return (
    // Fixed overlay covering the whole screen
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start z-50 overflow-y-auto">
      {/* Centered Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl m-8 max-w-4xl w-full transform transition-all duration-300">
        
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button removed for pop-up style, replaced with close X on the left */}
            <h1 className="text-2xl font-bold text-gray-900">
              User Detail View
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 p-2 rounded-full transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto">

          {/* Profile Overview - Main Card (Enhanced visual separation) */}
          <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-xl shadow-lg p-6 lg:p-8 relative border-2 border-cyan-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-white shadow-xl">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-600" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-white">
                    Lvl {user.hierarchyLevel || "N/A"}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-1">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-cyan-600 text-lg font-mono mb-3">@{user.username}</p>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status={user.status} />
                    {user.isKycVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-300">
                        <CheckCircle size={14} /> KYC Verified
                      </span>
                    )}
                    {user.isAuthorized && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold border border-purple-300">
                        <Shield size={14} /> Authorized
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-shadow shadow-md">
                <Edit2 size={18} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <User className="text-cyan-500" size={20} /> Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  {/* User ID */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200">
                      {user.id}
                    </p>
                  </div>
                  {/* Username */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Username
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base py-1">
                      {user.username}
                    </p>
                  </div>
                  {/* First Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      First Name
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base py-1">
                      {user.firstName}
                    </p>
                  </div>
                  {/* Last Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Last Name
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base py-1">
                      {user.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Mail className="text-cyan-500" size={20} /> Contact Information
                </h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">Email Address</label>
                      <p className="text-gray-900 font-semibold text-base break-all">
                        {user.email}
                      </p>
                      {!user.emailVerifiedAt && (
                        <span className="text-xs text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
                          <XCircle size={12} /> Not verified
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">Phone Number</label>
                      <p className="text-gray-900 font-semibold text-base">
                        {user.phoneNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Lock className="text-cyan-500" size={20} /> Security Information
                </h3>
                <div className="space-y-4">
                  {/* Password Hash */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Password Hash
                      </label>
                      <button
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1 text-sm font-medium"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-gray-900 font-mono text-xs break-all">
                      {showPassword
                        ? user.password || "N/A"
                        : "••••••••••••••••••••••••••••••••"}
                    </p>
                  </div>
                  {/* Transaction PIN Hash */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Transaction PIN Hash
                      </label>
                      <button
                        onClick={() => setShowTransactionPin((s) => !s)}
                        className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1 text-sm font-medium"
                        aria-label="Toggle transaction pin visibility"
                      >
                        {showTransactionPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showTransactionPin ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-gray-900 font-mono text-xs break-all">
                      {showTransactionPin
                        ? user.transactionPin || "N/A"
                        : "••••••••••••••••••••••••••••••••"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="lg:col-span-1 space-y-6">

              {/* Wallet Balance (Prominent Card) */}
              <div className="bg-gradient-to-br from-cyan-600 to-purple-700 rounded-xl shadow-xl p-6 text-white w-full">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet size={24} className="text-cyan-200" />
                  <h3 className="text-lg font-semibold">Wallet Balance</h3>
                </div>
                <p className="text-4xl font-extrabold mb-2">
                  ₹{parseFloat(user.walletBalance || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-cyan-100 text-sm font-medium">Available Balance</p>
              </div>

              {/* Hierarchy Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <TrendingUp className="text-cyan-500" size={20} /> Hierarchy
                </h3>
                <div className="space-y-4">
                  {/* Level */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Hierarchy Level
                    </label>
                    <p className="text-gray-900 mt-1 font-bold text-xl">
                      Level {user.hierarchyLevel || "N/A"}
                    </p>
                  </div>
                  {/* Parent */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Parent User
                    </label>
                    <div className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Users className="text-cyan-600" size={18} />
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">
                          @{user.parent?.username || "N/A"}
                        </p>
                        <p className="text-gray-600 text-xs font-mono">
                          ID: {user.parentId || "No parent ID"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Path */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Hierarchy Path
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200">
                      {user.hierarchyPath || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Shield className="text-cyan-500" size={20} /> Role Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Role Name
                    </label>
                    <p className="text-gray-900 mt-1 font-bold text-lg">
                      {user.role?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Role Level
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base">
                      {user.role?.level || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Role ID
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200">
                      {user.role?.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Timestamps & Stats */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Calendar className="text-cyan-500" size={20} /> Timestamps & Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Created At</label>
                    <p className="text-gray-900 mt-1 text-sm">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Updated At</label>
                    <p className="text-gray-900 mt-1 text-sm">{formatDate(user.updatedAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Email Verified</label>
                    <p className="text-gray-900 mt-1 text-sm">{formatDate(user.emailVerifiedAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Total Wallets</label>
                    <p className="text-gray-900 mt-1 font-bold text-base">{user.wallets?.length || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Direct Children</label>
                    <p className="text-gray-900 mt-1 font-bold text-base">{user.children?.length || 0}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}