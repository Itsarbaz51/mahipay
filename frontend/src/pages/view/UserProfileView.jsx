import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  EyeOff,
  TrendingUp,
  Lock,
  X,
  Wallet,
  Briefcase,
  Hash,
  Building,
  UserCheck,
} from "lucide-react";

export default function UserProfileView({
  isAdminUser,
  userData,
  onClose,
  type = "business",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showTransactionPin, setShowTransactionPin] = useState(false);

  // Handle different response structures and types
  const user = userData?.data?.user || userData?.user || userData;

  // Determine user type and adjust data structure accordingly
  const isEmployee = type === "employee";
  const userTypeLabel = isEmployee ? "Employee" : "business";
  const userTypeIcon = isEmployee ? Building : UserCheck;

  // Adapt data structure based on type
  const adaptedUser = {
    // Common fields
    id: user?.id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    username: user?.username,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
    profileImage: user?.profileImage,
    status: user?.status,
    isKycVerified: user?.isKycVerified,
    isAuthorized: user?.isAuthorized,
    hierarchyLevel: user?.hierarchyLevel,
    hierarchyPath: user?.hierarchyPath,
    parentId: user?.parentId,
    parent: user?.parent,
    children: user?.children,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
    emailVerifiedAt: user?.emailVerifiedAt,

    // Security fields (only for admin)
    password: user?.password,
    transactionPin: user?.transactionPin,

    // Role information - adapt based on type
    role:
      user?.role ||
      (isEmployee
        ? { name: "Employee", level: user?.hierarchyLevel }
        : user?.role),

    // Wallet information
    wallets: user?.wallets || (user?.wallet ? [user.wallet] : []),

    // Type-specific fields
    employeeId: isEmployee ? user?.employeeId : null,
    employeeCode: isEmployee ? user?.employeeCode : null,
    department: isEmployee ? user?.department : null,
    designation: isEmployee ? user?.designation : null,
  };


  // console.log(userData);
  

  // --- Error State ---
  // if (!user || !user?.id) {
  //   alert("User not found");
  // }

  // --- Utility Functions ---
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --- Status Badge Component ---
  const StatusBadge = ({ status }) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-700 border-green-300",
      INACTIVE: "bg-red-100 text-red-700 border-red-300",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
      IN_ACTIVE: "bg-red-100 text-red-700 border-red-300",
      SUSPENDED: "bg-orange-100 text-orange-700 border-orange-300",
    };
    const label =
      status === "IN_ACTIVE"
        ? "Inactive"
        : status === "ACTIVE"
        ? "Active"
        : status === "SUSPENDED"
        ? "Suspended"
        : status;
    const Icon = status === "ACTIVE" ? CheckCircle : XCircle;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border transition-all duration-200 ${
          colors[status] || colors.PENDING
        }`}
      >
        <Icon size={14} />
        {label}
      </span>
    );
  };

  // --- New Stat Card Component ---
  const StatCard = ({
    icon: Icon,
    title,
    value,
    color = "cyan",
    subText = null,
  }) => (
    <div
      className={`p-4 bg-${color}-50 border border-${color}-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500 uppercase">{title}</h4>
        <Icon size={18} className={`text-${color}-600`} />
      </div>
      <p className="text-gray-900 mt-1 font-bold text-xl truncate">{value}</p>
      {subText && <p className="text-xs text-gray-500 mt-1">{subText}</p>}
    </div>
  );

  // --- Styling variables
  const detailCard =
    "bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full transition-all duration-300 hover:shadow-xl";
  const sectionTitleClass =
    "text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-cyan-100 pb-2 flex items-center gap-2";

  // Employee-specific fields
  const EmployeeSpecificInfo = () => {
    if (!isEmployee) return null;

    return (
      <div className={detailCard}>
        <h3 className={sectionTitleClass}>
          <Building className="text-cyan-500" size={24} /> Employee Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adaptedUser.employeeId && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Employee ID
              </label>
              <p className="text-gray-900 mt-1 font-mono text-sm font-semibold">
                {adaptedUser.employeeId}
              </p>
            </div>
          )}
          {adaptedUser.employeeCode && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Employee Code
              </label>
              <p className="text-gray-900 mt-1 font-mono text-sm font-semibold">
                {adaptedUser.employeeCode}
              </p>
            </div>
          )}
          {adaptedUser.department && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Department
              </label>
              <p className="text-gray-900 mt-1 font-semibold text-base">
                {adaptedUser.department}
              </p>
            </div>
          )}
          {adaptedUser.designation && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Designation
              </label>
              <p className="text-gray-900 mt-1 font-semibold text-base">
                {adaptedUser.designation}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Pop-up Structure ---
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto p-4">
      {/* Centered Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl my-8 max-w-5xl w-full transform transition-all duration-500 scale-100 opacity-100 animate-in fade-in zoom-in duration-300">
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-3xl p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <userTypeIcon className="text-cyan-500" size={24} />
            {userTypeLabel} Profile Detail
          </h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 md:p-8 space-y-8 max-h-[85vh] overflow-y-auto">
          {/* Profile Overview - Main Card */}
          <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-2xl shadow-xl p-6 lg:p-8 relative border-4 border-cyan-200/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image & Level Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center border-4 border-white shadow-2xl">
                  {adaptedUser?.profileImage ? (
                    <img
                      src={adaptedUser?.profileImage}
                      alt={`${adaptedUser?.firstName} ${adaptedUser?.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">
                  {isEmployee ? "Emp" : "Lvl"}{" "}
                  {adaptedUser?.hierarchyLevel || "N/A"}
                </div>
              </div>

              {/* Name & Badges */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1 leading-tight">
                  {adaptedUser?.firstName} {adaptedUser?.lastName}
                </h2>
                <p className="text-purple-600 text-xl font-mono mb-4">
                  @{adaptedUser?.username}
                  {isEmployee && adaptedUser?.employeeCode && (
                    <span className="text-gray-500 ml-2">
                      ({adaptedUser.employeeCode})
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <StatusBadge status={adaptedUser?.status} />

                  {adaptedUser?.isKycVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-300 transition-all duration-200 hover:bg-blue-200">
                      <CheckCircle size={14} /> KYC Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold border border-gray-300 transition-all duration-200 hover:bg-gray-200">
                      <XCircle size={14} /> KYC Not Verified
                    </span>
                  )}

                  {adaptedUser?.isAuthorized && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold border border-purple-300 transition-all duration-200 hover:bg-purple-200">
                      <Shield size={14} /> Authorized
                    </span>
                  )}

                  {isEmployee ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 transition-all duration-200 hover:bg-green-200">
                      <Building size={14} /> Employee
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 transition-all duration-200 hover:bg-green-200">
                      <UserCheck size={14} /> Business User
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Specific Info */}
          <EmployeeSpecificInfo />

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {!isEmployee && (
              <StatCard
                icon={Wallet}
                title="Current Balance"
                value={formatCurrency(adaptedUser?.wallets?.[0]?.balance || 0)}
                color="green"
              />
            )}
            <StatCard
              icon={Users}
              title="Direct Children"
              value={adaptedUser?.children?.length || 0}
              color="purple"
              subText="View list below"
            />

            <StatCard
              icon={Briefcase}
              title={isEmployee ? "Designation" : "Role Level"}
              value={
                isEmployee
                  ? adaptedUser?.designation ||
                    adaptedUser?.role?.level ||
                    "N/A"
                  : adaptedUser?.role?.level || "N/A"
              }
              color="orange"
            />
            <StatCard
              icon={Calendar}
              title="Member Since"
              value={
                adaptedUser?.createdAt
                  ? new Date(adaptedUser?.createdAt).getFullYear()
                  : "N/A"
              }
              color="blue"
              subText={
                adaptedUser?.createdAt
                  ? new Date(adaptedUser?.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
          </div>

          {/* Detailed Information Grid: 2/3 (Left) and 1/3 (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main Content Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info & IDs */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <User className="text-cyan-500" size={24} /> General Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* User ID (Highlighting its importance) */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <Hash size={14} /> Unique {userTypeLabel} ID
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-sm break-all font-semibold">
                      {adaptedUser?.id}
                    </p>
                  </div>
                  {/* Username */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Username
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-lg">
                      @{adaptedUser?.username}
                    </p>
                  </div>
                  {/* First Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      First Name
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base">
                      {adaptedUser?.firstName}
                    </p>
                  </div>
                  {/* Last Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Last Name
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base">
                      {adaptedUser?.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Mail className="text-cyan-500" size={24} /> Contact
                  Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">
                        Email Address
                      </label>
                      <p className="text-gray-900 font-semibold text-base break-all">
                        {adaptedUser?.email}
                      </p>
                      <span
                        className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                          adaptedUser?.emailVerifiedAt
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {adaptedUser?.emailVerifiedAt ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {adaptedUser?.emailVerifiedAt
                          ? "Verified"
                          : "Not verified"}
                      </span>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">
                        Phone Number
                      </label>
                      <p className="text-gray-900 font-semibold text-base">
                        {adaptedUser?.phoneNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              {isAdminUser && (
                <div className={detailCard}>
                  <h3 className={sectionTitleClass}>
                    <Lock className="text-cyan-500" size={24} /> Security
                    Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Password Hash */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-cyan-400 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Password Hash
                        </label>
                        <button
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1 text-sm font-medium transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                          {showPassword ? "Hide Hash" : "Show Hash"}
                        </button>
                      </div>
                      <p className="text-gray-900 font-mono text-xs break-all cursor-text select-all">
                        {showPassword
                          ? adaptedUser?.password || "N/A"
                          : "•••••••"}
                      </p>
                    </div>
                    {/* Transaction PIN Hash */}
                    {!isEmployee && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-cyan-400 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Transaction PIN Hash
                          </label>
                          <button
                            onClick={() => setShowTransactionPin((s) => !s)}
                            className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1 text-sm font-medium transition-colors"
                            aria-label="Toggle transaction pin visibility"
                          >
                            {showTransactionPin ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                            {showTransactionPin ? "Hide Hash" : "Show Hash"}
                          </button>
                        </div>
                        <p className="text-gray-900 font-mono text-xs break-all cursor-text select-all">
                          {showTransactionPin
                            ? adaptedUser?.transactionPin || "N/A"
                            : "•••••••"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Column (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Hierarchy Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <TrendingUp className="text-cyan-500" size={24} /> Hierarchy
                </h3>
                <div className="space-y-4">
                  {/* Parent */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Parent User
                    </label>
                    <div className="mt-1 flex items-center gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <Users className="text-cyan-600" size={20} />
                      <div>
                        <p className="text-gray-900 font-semibold text-base">
                          @{adaptedUser?.parent?.username || "N/A"}
                        </p>
                        <p className="text-gray-600 text-xs font-mono">
                          ID: {adaptedUser?.parentId || "No parent ID"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Path */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Hierarchy Path
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200 max-h-24 overflow-y-auto">
                      {adaptedUser?.hierarchyPath || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Shield className="text-cyan-500" size={24} />{" "}
                  {isEmployee ? "Employee" : "Role"} Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      {isEmployee ? "Designation" : "Role Name"}
                    </label>
                    <p className="text-gray-900 mt-1 font-bold text-lg p-2 bg-purple-50 rounded-md border border-purple-200">
                      {isEmployee
                        ? adaptedUser?.designation ||
                          adaptedUser?.role?.name ||
                          "N/A"
                        : adaptedUser?.role?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      {isEmployee ? "Department" : "Role ID"}
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200">
                      {isEmployee
                        ? adaptedUser?.department || "N/A"
                        : adaptedUser?.role?.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Calendar className="text-cyan-500" size={24} /> Timestamps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </label>
                    <p className="text-gray-900 mt-1 text-sm font-medium">
                      {formatDate(adaptedUser?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Last Updated
                    </label>
                    <p className="text-gray-900 mt-1 text-sm font-medium">
                      {formatDate(adaptedUser?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Children List - Full Width Section */}
          {adaptedUser?.children && adaptedUser?.children.length > 0 && (
            <div className={detailCard}>
              <h3 className={sectionTitleClass}>
                <Users className="text-cyan-500" size={24} /> Direct{" "}
                {isEmployee ? "Team Members" : "Children"} (
                {adaptedUser?.children.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adaptedUser?.children.map((child) => (
                  <div
                    key={child.id}
                    className="p-4 border rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors duration-200 shadow-sm"
                  >
                    <p className="font-bold text-gray-900 text-lg mb-1">
                      @{child.username}
                    </p>
                    <p className="text-sm text-gray-700">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Mail size={12} /> {child.email}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
