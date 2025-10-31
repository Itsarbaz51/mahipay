import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Edit,
  Camera,
  Lock,
  Mail,
} from "lucide-react";
import {
  getCurrentUserProfile,
  updateProfile,
  updateUserProfileImage,
} from "../redux/slices/userSlice";
import { updateCredentials, forgotPassword } from "../redux/slices/authSlice";
import ForgotPasswordModal from "../components/forms/ForgotPasswordModal";

const DebouncedInput = ({ value, onChange, delay = 300, ...props }) => {
  const [internalValue, setInternalValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  };

  return <input value={internalValue} onChange={handleChange} {...props} />;
};

const UserProfilePage = ({ onClose }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [credentialsMode, setCredentialsMode] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  // Use refs to prevent unnecessary re-renders
  const userDataRef = useRef(null);
  const isAdminUserRef = useRef(false);

  // Redux state - use shallow equality check
  const { currentUser, isLoading: userLoading } = useSelector(
    (state) => state.users,
    (left, right) => left.currentUser?.id === right.currentUser?.id
  );

  const { currentUser: authUser } = useSelector(
    (state) => state.auth,
    (left, right) => left.currentUser?.id === right.currentUser?.id
  );

  // Use currentUser from userSlice first, fallback to authUser
  const userData = currentUser || authUser;

  // Update refs without causing re-renders
  useEffect(() => {
    if (userData) {
      userDataRef.current = userData;
      isAdminUserRef.current = (userData.role?.name || "") === "ADMIN";
    }
  }, [userData]);

  // Form states - use ref for initial values
  const initialProfileFormRef = useRef({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    email: "",
  });

  const [profileForm, setProfileForm] = useState(initialProfileFormRef.current);
  const [credentialsForm, setCredentialsForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    currentTransactionPin: "",
    newTransactionPin: "",
    confirmTransactionPin: "",
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
  });

  // Stable input handlers
  const handleProfileInputChange = useCallback((field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCredentialsInputChange = useCallback((field, value) => {
    setCredentialsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Fetch user data only once on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Update form only when userData actually changes significantly
  useEffect(() => {
    if (userData && userData.id) {
      const newFormData = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        username: userData.username || "",
        phoneNumber: userData.phoneNumber || "",
        email: userData.email || "",
      };

      // Deep comparison to avoid unnecessary updates
      setProfileForm((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newFormData)) {
          return newFormData;
        }
        return prev;
      });

      setForgotPasswordForm((prev) => ({
        email: userData.email || "",
      }));
    }
  }, [
    userData?.id,
    userData?.firstName,
    userData?.lastName,
    userData?.username,
    userData?.phoneNumber,
    userData?.email,
  ]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      await dispatch(getCurrentUserProfile());
    } catch (error) {
      setError(error.message);
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const updateData = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        username: profileForm.username,
        phoneNumber: profileForm.phoneNumber,
        ...(isAdminUserRef.current &&
        profileForm.email !== userDataRef.current?.email
          ? { email: profileForm.email }
          : {}),
      };

      await dispatch(updateProfile(userDataRef.current.id, updateData));
      setEditMode(false);
      setSuccess("Profile updated successfully!");

      // Only refetch if absolutely necessary
      setTimeout(() => {
        fetchUserProfile();
      }, 1000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (
        credentialsForm.newPassword &&
        credentialsForm.newPassword !== credentialsForm.confirmPassword
      ) {
        setError("New passwords do not match");
        return;
      }

      if (
        credentialsForm.newTransactionPin &&
        credentialsForm.newTransactionPin !==
          credentialsForm.confirmTransactionPin
      ) {
        setError("New transaction PINs do not match");
        return;
      }

      if (!credentialsForm.currentPassword) {
        setError("Current password is required to make changes");
        return;
      }

      const credentialsData = {
        currentPassword: credentialsForm.currentPassword,
        ...(credentialsForm.newPassword && {
          newPassword: credentialsForm.newPassword,
        }),
        ...(credentialsForm.newTransactionPin && {
          newTransactionPin: credentialsForm.newTransactionPin,
          currentTransactionPin: credentialsForm.currentTransactionPin,
        }),
      };

      await dispatch(
        updateCredentials({
          userId: userDataRef.current.id,
          credentialsData,
          currentUserId: userDataRef.current.id,
        })
      );

      setCredentialsMode(false);
      setSuccess("Credentials updated successfully!");
      setCredentialsForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        currentTransactionPin: "",
        newTransactionPin: "",
        confirmTransactionPin: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!forgotPasswordForm.email) {
        setError("Email address is required");
        return;
      }

      await dispatch(forgotPassword(forgotPasswordForm.email));

      setForgotPasswordMode(false);
      setSuccess(
        "Password reset link sent to your email! Please check your inbox."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpdate = async (file) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("profileImage", file);

      await dispatch(updateUserProfileImage(userDataRef.current.id, formData));
      setSuccess("Profile image updated successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Memoized helper functions
  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      IN_ACTIVE: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
      DELETE: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
    };

    const statusConfig = statusMap[status] || statusMap.IN_ACTIVE;
    const IconComponent = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {status || "Unknown"}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }, []);

  // --- Loading State ---
  if (loading || userLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading user profile...</span>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <XCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchUserProfile}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- No Data ---
  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No user data found.
      </div>
    );
  }

  // --- Profile Image Section ---
  const ProfileImageSection = () => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={userData.profileImage || "/default-avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          <label
            htmlFor="profileImage"
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleProfileImageUpdate(file);
              }}
            />
          </label>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {userData.firstName} {userData.lastName}
          </h1>
          <p className="text-gray-500">{userData.email}</p>
          <div className="mt-2 flex items-center space-x-4">
            {getStatusBadge(userData.status)}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Shield className="w-3 h-3 mr-1" />
              {userData.role?.name || "N/A"}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {userData.wallets?.[0]
                ? formatCurrency(userData.wallets[0].balance)
                : "₹0.00"}
            </div>
            <div className="text-xs text-gray-500">Balance</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {userData.children?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Children</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {userData.kycInfo?.isKycSubmitted ? "Verified" : "Pending"}
            </div>
            <div className="text-xs text-gray-500">KYC</div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Profile Information Section ---
  const ProfileInformationSection = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2 text-gray-600" />
          Profile Information
        </h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Edit className="w-4 h-4" />
          <span>{editMode ? "Cancel" : "Edit"}</span>
        </button>
      </div>

      <div className="px-6 py-4">
        {editMode ? (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <DebouncedInput
                  type="text"
                  value={profileForm.firstName}
                  onChange={(value) =>
                    handleProfileInputChange("firstName", value)
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <DebouncedInput
                  type="text"
                  value={profileForm.lastName}
                  onChange={(value) =>
                    handleProfileInputChange("lastName", value)
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username *
              </label>
              <DebouncedInput
                type="text"
                value={profileForm.username}
                onChange={(value) =>
                  handleProfileInputChange("username", value)
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <DebouncedInput
                type="tel"
                value={profileForm.phoneNumber}
                onChange={(value) =>
                  handleProfileInputChange("phoneNumber", value)
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <DebouncedInput
                type="email"
                value={profileForm.email}
                onChange={(value) => handleProfileInputChange("email", value)}
                className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  !isAdminUserRef.current
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
                required
                disabled={!isAdminUserRef.current}
              />
              {!isAdminUserRef.current && (
                <p className="text-sm text-gray-500 mt-1">
                  Contact administrator to change email address
                </p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  First Name
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {userData.firstName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Last Name
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {userData.lastName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Username
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {userData.username}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Phone Number
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {userData.phoneNumber}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {userData.email}
              </p>
              {!isAdminUserRef.current && (
                <p className="text-xs text-gray-500 mt-1">
                  Contact administrator to change email address
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  User ID
                </label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {userData.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Role
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {userData.role?.name} - {userData.role?.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Created At
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(userData.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(userData.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // --- Credentials Section ---
  const CredentialsSection = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-gray-600" />
          Security & Credentials
        </h2>
        <button
          onClick={() => setCredentialsMode(!credentialsMode)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Edit className="w-4 h-4" />
          <span>{credentialsMode ? "Cancel" : "Change Credentials"}</span>
        </button>
      </div>

      <div className="px-6 py-4">
        {credentialsMode ? (
          <form onSubmit={handleCredentialsUpdate} className="space-y-6">
            {/* Password Change Section */}
            <div className="border-b pb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password *
                  </label>
                  <DebouncedInput
                    type="password"
                    value={credentialsForm.currentPassword}
                    onChange={(value) =>
                      handleCredentialsInputChange("currentPassword", value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <DebouncedInput
                    type="password"
                    value={credentialsForm.newPassword}
                    onChange={(value) =>
                      handleCredentialsInputChange("newPassword", value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <DebouncedInput
                    type="password"
                    value={credentialsForm.confirmPassword}
                    onChange={(value) =>
                      handleCredentialsInputChange("confirmPassword", value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>
            </div>

            {/* Transaction PIN Section */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Change Transaction PIN
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Transaction PIN
                  </label>
                  <DebouncedInput
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={credentialsForm.currentTransactionPin}
                    onChange={(value) =>
                      handleCredentialsInputChange(
                        "currentTransactionPin",
                        value.replace(/\D/g, "")
                      )
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current 4-digit PIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Transaction PIN
                  </label>
                  <DebouncedInput
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={credentialsForm.newTransactionPin}
                    onChange={(value) =>
                      handleCredentialsInputChange(
                        "newTransactionPin",
                        value.replace(/\D/g, "")
                      )
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new 4-digit PIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Transaction PIN
                  </label>
                  <DebouncedInput
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={credentialsForm.confirmTransactionPin}
                    onChange={(value) =>
                      handleCredentialsInputChange(
                        "confirmTransactionPin",
                        value.replace(/\D/g, "")
                      )
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new 4-digit PIN"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Updating..." : "Update Credentials"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCredentialsMode(false);
                  setCredentialsForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                    currentTransactionPin: "",
                    newTransactionPin: "",
                    confirmTransactionPin: "",
                  });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Password Management
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setForgotPasswordMode(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Use "Send Password Reset Link" to receive a reset token via
                  email, then use "Reset Password with Token" to set a new
                  password.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Transaction PIN
              </h3>
              <p className="text-sm text-gray-600">
                Your 4-digit transaction PIN is used for secure financial
                transactions. Keep it confidential and change it regularly for
                security.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                Security Tips
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • Use a strong, unique password with letters, numbers, and
                  symbols
                </li>
                <li>• Never share your password or PIN with anyone</li>
                <li>• Change your password regularly</li>
                <li>• Use a different PIN than your other accounts</li>
                <li>• Log out from shared devices</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 w-full min-h-screen rounded-2xl py-8 px-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Profile Image and Quick Stats */}
      <ProfileImageSection />

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "credentials"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Security & Credentials
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "profile" && <ProfileInformationSection />}
        {activeTab === "credentials" && <CredentialsSection />}
      </div>

      {/* Modals */}
      {forgotPasswordMode && (
        <ForgotPasswordModal
          setForgotPasswordMode={setForgotPasswordMode}
          handleForgotPassword={handleForgotPassword}
          forgotPasswordForm={forgotPasswordForm}
          setForgotPasswordForm={setForgotPasswordForm}
          loading={loading}
          userData={userData}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
