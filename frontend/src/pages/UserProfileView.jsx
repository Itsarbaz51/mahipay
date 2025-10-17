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

  const user = userData?.data?.user;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-6">Unable to load user data.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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

  const card = "bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden";

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-start z-50 overflow-auto pt-28 pb-12 py-12">
      <div className="w-full max-w-6xl mx-auto px-6 bg-white ">
        {/* Header */}
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between fixed top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 shadow-md z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              aria-label="Back"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                User Profile
              </h1>
              <p className="text-cyan-100">View detailed user information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 mt-4 relative">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  Level {user.hierarchyLevel || "N/A"}
                </div>
              </div>

              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 text-lg mb-3">@{user.username}</p>
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

            <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-shadow shadow">
              <Edit2 size={18} /> Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="text-cyan-500" size={24} /> Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    User ID
                  </label>
                  <p className="text-gray-900 mt-1 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                    {user.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Username
                  </label>
                  <p className="text-gray-900 mt-1 font-semibold text-lg">
                    {user.username}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    First Name
                  </label>
                  <p className="text-gray-900 mt-1 font-semibold text-lg">
                    {user.firstName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Last Name
                  </label>
                  <p className="text-gray-900 mt-1 font-semibold text-lg">
                    {user.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="text-cyan-500" size={24} /> Contact Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Mail className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-500">
                      Email Address
                    </label>
                    <p className="text-gray-900 font-semibold break-all">
                      {user.email}
                    </p>
                    {!user.emailVerifiedAt && (
                      <span className="text-xs text-orange-600 font-semibold">
                        Not verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Phone className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {user.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="text-cyan-500" size={24} /> Security
                Information
              </h3>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-500">
                      Password Hash
                    </label>
                    <button
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {showPassword
                      ? user.password
                      : "••••••••••••••••••••••••••••••••"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-500">
                      Transaction PIN Hash
                    </label>
                    <button
                      onClick={() => setShowTransactionPin((s) => !s)}
                      className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                      aria-label="Toggle transaction pin visibility"
                    >
                      {showTransactionPin ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                      {showTransactionPin ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {showTransactionPin
                      ? user.transactionPin
                      : "••••••••••••••••••••••••••••••••"}
                  </p>
                </div>
              </div>
            </div>

            {/* Hierarchy Info */}
            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-cyan-500" size={24} /> Hierarchy
                Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Hierarchy Level
                  </label>
                  <p className="text-gray-900 mt-1 font-semibold text-2xl">
                    {user.hierarchyLevel || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Hierarchy Path
                  </label>
                  <p className="text-gray-900 mt-1 font-mono bg-gray-50 px-3 py-2 rounded-lg break-all">
                    {user.hierarchyPath || "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Parent User
                  </label>
                  <div className="mt-2 flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg border border-cyan-200">
                    <Users className="text-cyan-600" size={20} />
                    <div>
                      <p className="text-gray-900 font-semibold">
                        @{user.parent?.username || "N/A"}
                      </p>
                      <p className="text-gray-600 text-sm font-mono">
                        {user.parentId || "No parent"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white w-full">
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={24} />
                <h3 className="text-lg font-semibold">Wallet Balance</h3>
              </div>
              <p className="text-4xl font-bold mb-2">
                ₹{parseFloat(user.walletBalance || 0).toLocaleString()}
              </p>
              <p className="text-cyan-100 text-sm">Available Balance</p>
            </div>

            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="text-cyan-500" size={24} /> Role Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Role Name
                  </label>
                  <p className="text-gray-900 mt-1 font-bold text-xl">
                    {user.role?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Role Level
                  </label>
                  <p className="text-gray-900 mt-1 font-semibold text-lg">
                    {user.role?.level || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Role ID
                  </label>
                  <p className="text-gray-900 mt-1 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg break-all">
                    {user.role?.id || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="text-cyan-500" size={24} /> Timestamps
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Created At
                  </label>
                  <p className="text-gray-900 mt-1 text-sm">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Updated At
                  </label>
                  <p className="text-gray-900 mt-1 text-sm">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Email Verified
                  </label>
                  <p className="text-gray-900 mt-1 text-sm">
                    {formatDate(user.emailVerifiedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className={card}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Wallets</span>
                  <span className="font-bold text-gray-900">
                    {user.wallets?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Direct Children</span>
                  <span className="font-bold text-gray-900">
                    {user.children?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
