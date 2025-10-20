import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  User,
  Phone,
  Mail,
  Wallet,
  Users,
  X,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

import AddMember from "../forms/AddMember";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsersByParentId,
  getUserById,
  updateUserStatus,
  setCurrentUser,
  clearUserError,
  clearUserSuccess,
} from "../../redux/slices/userSlice";

import HeaderSection from "../ui/HeaderSection";
import ButtonField from "../ui/ButtonField";
import ConfirmCard from "../ui/ConfirmCard";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import ActionsMenu from "../ui/ActionsMenu";
import UserProfileView from "../../pages/UserProfileView";
import EditCredentialsModal from "../forms/EditCredentialsModal";
import EditProfileImageModal from "../forms/EditProfileImageModal";

const MembersTable = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [showPins, setShowPins] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false); // Track initial load

  const {
    users = [],
    isLoading = false,
    currentUser: viewedUser = null,
    pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    error: userError,
    success: userSuccess,
  } = useSelector((state) => state.users || {});

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const totalUsers = pagination.total;
  const limit = pagination.limit;

  // FIXED: Load users function - SINGLE SOURCE OF TRUTH
  const loadUsers = useCallback(
    async (searchTerm = "", forceRefresh = false, isSearch = false) => {
      try {
        const params = {
          page: isSearch ? 1 : currentPage,
          limit,
          sort: "desc",
          status: "ALL",
          search: searchTerm,
        };

        if (forceRefresh) {
          params.timestamp = Date.now();
          params.refresh = true;
        }

        await dispatch(getAllUsersByParentId(params));
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    },
    [dispatch, currentPage, limit]
  );

  // FIXED: Toast handling - NO API CALLS HERE
  useEffect(() => {
    if (userError) {
      toast.error(userError);
      dispatch(clearUserError());
    }

    if (userSuccess) {
      // Only show generic success messages
      if (
        userSuccess &&
        !userSuccess.toLowerCase().includes("registered") &&
        !userSuccess.toLowerCase().includes("updated") &&
        !userSuccess.toLowerCase().includes("created") &&
        !userSuccess.toLowerCase().includes("added")
      ) {
        toast.success(userSuccess);
      }
      dispatch(clearUserSuccess());
    }
  }, [userError, userSuccess, dispatch]);

  // FIXED: Initial load - RUNS ONLY ONCE
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      console.log("🚀 Initial load - API call 1");
      loadUsers();
    }
  }, []); // Empty dependency array - runs only once on mount

  // FIXED: Search with proper debouncing - ONLY TRIGGERS AFTER INITIAL LOAD
  useEffect(() => {
    // Skip initial render and empty search on mount
    if (!initialLoadRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log("🔍 Search triggered - API call 2");
      loadUsers(search, true, true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, loadUsers]);

  // FIXED: Refresh trigger - ONLY TRIGGERS AFTER INITIAL LOAD
  useEffect(() => {
    if (refreshTrigger > 0 && initialLoadRef.current) {
      console.log("🔄 Refresh triggered - API call 3");
      loadUsers(search, true);
    }
  }, [refreshTrigger, loadUsers, search]);

  // FIXED: Manual refresh - SIMPLIFIED
  const handleManualRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // FIXED: Page change - DIRECT DISPATCH (NO loadUsers CALL)
  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        console.log("📄 Page change - API call 4");
        dispatch(
          getAllUsersByParentId({
            page,
            limit,
            sort: "desc",
            status: "ALL",
            search,
            timestamp: Date.now(),
          })
        );
      }
    },
    [dispatch, totalPages, limit, search]
  );

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case "STATE HEAD":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "STATE HOLDER":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "MASTER DISTRIBUTOR":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DISTRIBUTOR":
        return "bg-green-100 text-green-800 border-green-300";
      case "AGENT":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleDisplayName = (roleName) => {
    switch (roleName) {
      case "STATE HEAD":
        return "State Head";
      case "STATE HOLDER":
        return "State Holder";
      case "MASTER DISTRIBUTOR":
        return "Master Distributor";
      case "DISTRIBUTOR":
        return "Distributor";
      case "AGENT":
        return "Agent";
      default:
        return roleName || "Unknown";
    }
  };

  const maskSensitiveData = (data, type = "password") => {
    if (!data) return "••••••";
    return "•".repeat(6);
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const togglePinVisibility = (userId) => {
    setShowPins((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const confirmAction = async () => {
    if (actionType && selectedUser) {
      try {
        const newStatus =
          selectedUser.status === "ACTIVE" ? "IN_ACTIVE" : "ACTIVE";
        await dispatch(updateUserStatus(selectedUser.id, newStatus));
        // Refresh after status change
        setTimeout(() => {
          handleManualRefresh();
        }, 500);
      } catch (error) {
        console.error("Failed to update user status:", error);
      }
    }
    setShowActionModal(false);
    setSelectedUser(null);
  };

  const handleViewUser = async (user) => {
    try {
      await dispatch(getUserById(user.id));
      setShowViewProfile(true);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to load user details:", error);
      dispatch(setCurrentUser(user));
      setShowViewProfile(true);
      setOpenMenuId(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedUser(null);
    handleManualRefresh();
  };

  const handleEditProfileSuccess = () => {
    setShowEditProfile(false);
    setSelectedUser(null);
    handleManualRefresh();
  };

  const handleCredentialsSuccess = () => {
    setShowEditPassword(false);
    setShowEditPin(false);
    setSelectedUser(null);
    handleManualRefresh();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phoneNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <HeaderSection
        title="Members Management"
        tagLine="Manage your team members and their access levels"
        icon={Users}
        totalCount={`${totalUsers || 0} Members`}
      />

      {/* Search + Add Member */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Team Members
            </h2>
            <p className="text-gray-600">Manage and monitor your team</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-gray-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className={`px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 transition-colors ${
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>

            <ButtonField
              name="Add Member"
              isOpen={() => {
                setSelectedUser(null);
                setShowForm(true);
              }}
              icon={Users}
              css
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white w-full rounded-xl h-full shadow-lg border border-gray-300 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Member
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Password
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Transaction PIN
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Wallet
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <EmptyState type="loading" />
            ) : filteredUsers.length === 0 ? (
              <EmptyState type={search ? "search" : "empty"} search={search} />
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-blue-50 transition-all">
                  <td className="px-6 py-5">
                    {(currentPage - 1) * limit + index + 1}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={() =>
                          user.profileImage &&
                          setPreviewImage(user.profileImage)
                        }
                      >
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.firstName || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {user.firstName + " " + (user.lastName || "")}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {user.phoneNumber}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(
                        user.role?.name
                      )}`}
                    >
                      {getRoleDisplayName(user.role?.name)}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">
                        {showPasswords[user.id]
                          ? user.password
                          : maskSensitiveData(user.password)}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords[user.id] ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">
                        {showPins[user.id]
                          ? user.transactionPin
                          : maskSensitiveData(user.transactionPin, "pin")}
                      </span>
                      <button
                        onClick={() => togglePinVisibility(user.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPins[user.id] ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-sm font-semibold ${
                          (user.wallets?.[0]?.balance || 0) > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        ₹
                        {(
                          (user.wallets?.[0]?.balance || 0) / 100
                        ).toLocaleString() || 0}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                        user.status === "IN_ACTIVE"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-green-100 text-green-800 border-green-300"
                      }`}
                    >
                      {user.status === "IN_ACTIVE" ? "Inactive" : "Active"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center relative">
                    <div className="inline-block relative">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100"
                        onClick={() =>
                          setOpenMenuId(openMenuId === user.id ? null : user.id)
                        }
                      >
                        {openMenuId === user.id ? (
                          <X className="w-5 h-5 text-gray-600" />
                        ) : (
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        )}
                      </button>

                      {openMenuId === user.id && (
                        <ActionsMenu
                          user={user}
                          onView={handleViewUser}
                          onEdit={(user) => {
                            setSelectedUser(user);
                            setShowForm(true);
                            setOpenMenuId(null);
                          }}
                          onEditProfile={(user) => {
                            setSelectedUser(user);
                            setShowEditProfile(true);
                            setOpenMenuId(null);
                          }}
                          onEditPassword={(user) => {
                            setSelectedUser(user);
                            setShowEditPassword(true);
                            setOpenMenuId(null);
                          }}
                          onEditPin={(user) => {
                            setSelectedUser(user);
                            setShowEditPin(true);
                            setOpenMenuId(null);
                          }}
                          onSettings={(user) => {
                            // Handle settings
                          }}
                          onLoginAs={(user) => {
                            // Handle login as
                          }}
                          onToggleStatus={(user) => {
                            setActionType(
                              user.status === "IN_ACTIVE"
                                ? "Activate"
                                : "Deactivate"
                            );
                            setSelectedUser(user);
                            setShowActionModal(true);
                            setOpenMenuId(null);
                          }}
                          onClose={() => setOpenMenuId(null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Profile Modal */}
      {showViewProfile && (
        <UserProfileView
          userData={viewedUser || selectedUser}
          onClose={() => {
            setShowViewProfile(false);
            dispatch(setCurrentUser(null));
          }}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90%] max-h-[85%]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold hover:text-gray-300"
            >
              ×
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[50vh] rounded-lg shadow-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <ConfirmCard
          actionType={actionType}
          isClose={() => setShowActionModal(false)}
          isSubmit={confirmAction}
        />
      )}

      {/* Add/Edit Member Modal */}
      {showForm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddMember
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
            editData={selectedUser}
          />
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && selectedUser && (
        <EditProfileImageModal
          user={selectedUser}
          onClose={() => {
            setShowEditProfile(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditProfileSuccess}
        />
      )}

      {/* Edit Password Modal */}
      {showEditPassword && selectedUser && (
        <EditCredentialsModal
          user={selectedUser}
          type="password"
          onClose={() => {
            setShowEditPassword(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCredentialsSuccess}
        />
      )}

      {/* Edit PIN Modal */}
      {showEditPin && selectedUser && (
        <EditCredentialsModal
          user={selectedUser}
          type="pin"
          onClose={() => {
            setShowEditPin(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCredentialsSuccess}
        />
      )}
    </div>
  );
};

export default MembersTable;
