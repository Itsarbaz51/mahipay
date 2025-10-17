import { useEffect, useState, useRef } from "react";
import {
  Search,
  User,
  Phone,
  Mail,
  Wallet,
  Users,
  X,
  MoreVertical,
} from "lucide-react";

import AddMember from "../forms/AddMember";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getUserById,
  updateUserStates,
} from "../../redux/slices/userSlice";

import HeaderSection from "../ui/HeaderSection";
import ButtonField from "../ui/ButtonField";
import ConfirmCard from "../ui/ConfirmCard";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import ActionsMenu from "../ui/ActionsMenu";
import UserProfileView from "../../pages/UserProfileView";

const MembersTable = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const dispatch = useDispatch();
  const {
    users: usersData,
    isLoading,
    selectedUser: viewedUser,
  } = useSelector((state) => state.user);

  const users = Array.isArray(usersData) ? usersData : [];

  useEffect(() => {
    dispatch(getAllUsers({ page: currentPage, limit })).then((res) => {
      const meta = res?.data;
      setTotalPages(meta?.totalPages || 1);
    });
  }, [dispatch, currentPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleColor = (roleName) => {
    switch (roleName) {
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

  const confirmAction = () => {
    if (actionType && selectedUser) {
      dispatch(updateUserStates(selectedUser.user.id, selectedUser.userData));
    }
    setShowActionModal(false);
    setSelectedUser(null);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredUsers = users?.filter(
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
        totalCount={`${filteredUsers?.length || 0} Members`}
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
            <ButtonField
              name={`Add Member`}
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
            ) : filteredUsers?.length === 0 ? (
              <EmptyState type={search ? "search" : "empty"} search={search} />
            ) : (
              filteredUsers?.map((user, index) => (
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
                          {user.firstName + " " + user.lastName}
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
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-sm font-semibold ${
                          user.walletBalance > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        ₹{user.walletBalance?.toLocaleString() || 0}
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
                      {user.status === "IN_ACTIVE" ? "Inactive" : user.status}
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
                          onView={(user) => {
                            dispatch(getUserById(user.id));
                            setShowViewProfile(true);
                            setOpenMenuId(null);
                          }}
                          onEdit={(user) => {
                            setSelectedUser(user);
                            setShowForm(true);
                            setOpenMenuId(null);
                          }}
                          onSettings={(user) => {
                            alert("Settings clicked for " + user.firstName);
                          }}
                          onLoginAs={(user) => {
                            alert("Log In as " + user.firstName);
                          }}
                          onToggleStatus={(user) => {
                            setActionType(
                              user.status === "IN_ACTIVE"
                                ? "Activate"
                                : "Deactivate"
                            );
                            setSelectedUser({ user, userData: {} });
                            setShowActionModal(true);
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
      {showViewProfile && viewedUser && (
        <UserProfileView
          userData={viewedUser}
          onClose={() => setShowViewProfile(false)}
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
            onClose={() => {
              setShowForm(false);
              setSelectedUser(null);
            }}
            editData={selectedUser}
          />
        </div>
      )}
    </div>
  );
};

export default MembersTable;
