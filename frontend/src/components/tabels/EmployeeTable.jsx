// EmployeeTable.js - UPDATED PERMISSIONS FIX
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  Phone,
  Mail,
  Wallet,
  X,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
  UsersRound,
  Filter,
  UserPlus,
  FileText,
  FileSpreadsheet,
  Printer,
  Copy,
  Shield,
} from "lucide-react";
import { toast } from "react-toastify";
import AddMember from "../forms/AddMember";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "../../redux/slices/userSlice";

// ✅ UPDATED: Import all employee actions from employeeSlice
import {
  getEmployeeById,
  getAllEmployeesByParentId,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployee,
  updateEmployeePermissions,
  getEmployeePermissions,
  clearEmployeeError,
  clearEmployeeSuccess,
} from "../../redux/slices/employeeSlice";

import ButtonField from "../ui/ButtonField";
import ConfirmCard from "../ui/ConfirmCard";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import ActionsMenu from "../ui/ActionsMenu";
import UserProfileView from "../../pages/view/UserProfileView";
import EditCredentialsModal from "../forms/EditCredentialsModal";
import EditProfileImageModal from "../forms/EditProfileImageModal";
import { login } from "../../redux/slices/authSlice";
import PageHeader from "../ui/PageHeader";
import AddEmployeePermissions from "../forms/AddEmployeePermissions";

const EmployeeTable = () => {
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
  const [showPasswords, setShowPasswords] = useState({});
  const [showPins, setShowPins] = useState({});

  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false);

  // --- Permission Modal States ---
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [existingPermissions, setExistingPermissions] = useState([]);
  const [permissionMode, setPermissionMode] = useState("add");

  // ✅ NEW: Store individual employee permissions
  const [employeePermissionsMap, setEmployeePermissionsMap] = useState({});

  // ✅ UPDATED: Use employee state with proper structure
  const employeesState = useSelector((state) => state.employees || {});
  const { permissionCheck } = employeesState;

  // ✅ CURRENT LOGGED-IN USER ka data get karo
  const authState = useSelector((state) => state.auth || {});
  const currentLoggedInUser = authState.currentUser || {};
  const currentUserRole = currentLoggedInUser.role?.name || "";
  const isAdminUser = currentUserRole === "ADMIN";

  const {
    employees = [],
    isLoading = false,
    currentEmployee: viewedEmployee = null,
    pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    error: employeeError,
    success: employeeSuccess,
    // ❌ REMOVED: We'll use local state instead of global permissions
  } = employeesState;

  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 0;
  const totalEmployees = pagination.total || 0;
  const limit = pagination.limit || 10;

  // ✅ UPDATED: Use employee-specific load function
  const loadEmployees = useCallback(
    async (page = 1, searchTerm = "", forceRefresh = false) => {
      try {
        const params = {
          page,
          limit,
          sort: "desc",
          status: "ALL",
        };

        if (searchTerm && searchTerm.trim() !== "") {
          params.search = searchTerm;
        }

        if (forceRefresh) {
          params.timestamp = Date.now();
        }

        await dispatch(getAllEmployeesByParentId(params));
      } catch (error) {
        console.error("Failed to load employees:", error);
        toast.error(error.message || "Failed to load employees");
      }
    },
    [dispatch, limit]
  );

  // ✅ UPDATED: Page change handler
  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        loadEmployees(page, search);
      }
    },
    [totalPages, loadEmployees, search]
  );

  // ✅ UPDATED: Manual refresh
  const handleManualRefresh = useCallback(() => {
    loadEmployees(1, search, true);
    toast.info("Refreshing data...");
  }, [loadEmployees, search]);

  // Toast handling - UPDATED for employee slice
  useEffect(() => {
    if (employeeError) {
      toast.error(employeeError);
      dispatch(clearEmployeeError());
    }

    if (employeeSuccess) {
      const lowerSuccess = employeeSuccess.toLowerCase();
      const isGenericSuccess = ![
        "registered",
        "updated",
        "created",
        "added",
        "activated",
        "deactivated",
      ].some((word) => lowerSuccess.includes(word));

      if (isGenericSuccess) {
        toast.success(employeeSuccess);
      }
      dispatch(clearEmployeeSuccess());
    }
  }, [employeeError, employeeSuccess, dispatch]);

  // ✅ UPDATED: Initial load only once
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadEmployees();
    }
  }, [loadEmployees]);

  // ✅ UPDATED: Search with debouncing
  useEffect(() => {
    if (!initialLoadRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadEmployees(1, search);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, loadEmployees]);

  // ✅ UPDATED: Permission effect - using employee permissions
  useEffect(() => {
    if (showPermissionModal && permissionUser?.id) {
      fetchEmployeePermissions(permissionUser.id);
    }
  }, [dispatch, showPermissionModal, permissionUser]);

  // ✅ NEW: Separate function to fetch employee permissions
  const fetchEmployeePermissions = async (employeeId) => {
    try {
      const result = await dispatch(getEmployeePermissions(employeeId));

      // ✅ Handle different response structures
      const permissions =
        result?.data?.permissions ||
        result?.permissions ||
        result?.data?.finalPermissions ||
        [];

      if (permissions && permissions.length > 0) {
        setExistingPermissions(permissions);
        setPermissionMode("edit");

        // ✅ Store permissions in local map for display
        setEmployeePermissionsMap((prev) => ({
          ...prev,
          [employeeId]: permissions,
        }));
      } else {
        setExistingPermissions([]);
        setPermissionMode("add");

        // ✅ Ensure empty array for this employee
        setEmployeePermissionsMap((prev) => ({
          ...prev,
          [employeeId]: [],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch employee permissions:", error);
      setExistingPermissions([]);
      setPermissionMode("add");
    }
  };

  // ✅ UPDATED: Open Permission Modal
  const handleAddPermission = async (user) => {
    setPermissionUser(user);
    setShowPermissionModal(true);
  };

  // ✅ UPDATED: Submit Permission - using employee permissions
  const handlePermissionSubmit = async (permissions) => {
    if (!permissionUser) return;

    try {
      const permissionsArray = Array.isArray(permissions) ? permissions : [];

      await dispatch(
        updateEmployeePermissions(permissionUser.id, permissionsArray)
      );

      // ✅ Update local permissions map after successful update
      setEmployeePermissionsMap((prev) => ({
        ...prev,
        [permissionUser.id]: permissionsArray,
      }));

      toast.success(
        `Permissions ${
          permissionMode === "add" ? "added" : "updated"
        } successfully!`
      );
      handleClosePermissionModal();
    } catch (error) {
      toast.error(error.message || "Failed to update permissions");
    }
  };

  // Close Modal
  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setPermissionUser(null);
    setPermissionMode("add");
    setExistingPermissions([]);
  };

  // ✅ UPDATED: Get permissions for specific employee from local map
  const getEmployeeSpecificPermissions = (employeeId) => {
    return employeePermissionsMap[employeeId] || [];
  };

  // ✅ NEW: Load permissions for all employees when data loads
  useEffect(() => {
    if (employees.length > 0 && isAdminUser) {
      // Load permissions for each employee
      employees.forEach((employee) => {
        if (!employeePermissionsMap[employee.id]) {
          // Fetch permissions only if not already loaded
          dispatch(getEmployeePermissions(employee.id))
            .then((result) => {
              const permissions =
                result?.data?.permissions ||
                result?.permissions ||
                result?.data?.finalPermissions ||
                [];

              setEmployeePermissionsMap((prev) => ({
                ...prev,
                [employee.id]: permissions,
              }));
            })
            .catch((error) => {
              console.error(
                `Failed to load permissions for employee ${employee.id}:`,
                error
              );
              // Set empty array if failed to load
              setEmployeePermissionsMap((prev) => ({
                ...prev,
                [employee.id]: [],
              }));
            });
        }
      });
    }
  }, [employees, isAdminUser, dispatch]);

  // Role colors and display names
  const getRoleColor = (roleName) => {
    const role = roleName?.toUpperCase();
    switch (role) {
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
      case "RETAILER":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleDisplayName = (roleName) => {
    const role = roleName?.toUpperCase();
    switch (role) {
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
      case "RETAILER":
        return "Retailer";
      default:
        return roleName || "Unknown";
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleLogin = async (user) => {
    if (!user?.email || !user?.password) return;

    const payload = {
      emailOrUsername: user.email || user.username,
      password: user.password,
    };

    try {
      await dispatch(login(payload));
      toast.success(`Logged in as ${user.username}`);
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Login failed!");
    }
  };

  // ✅ UPDATED: Use employee-specific actions with proper parameters
  const confirmAction = async (reason) => {
    if (actionType && selectedUser) {
      try {
        const finalReason = reason?.trim() || `${actionType}d by admin`;

        if (actionType === "Deactivate") {
          await dispatch(
            deactivateEmployee({
              employeeId: selectedUser.id,
              reason: finalReason,
            })
          );
        } else if (actionType === "Activate") {
          await dispatch(
            reactivateEmployee({
              employeeId: selectedUser.id,
              reason: finalReason,
            })
          );
        } else if (actionType === "Delete") {
          await dispatch(
            deleteEmployee({
              employeeId: selectedUser.id,
              reason: finalReason,
            })
          );
        }

        toast.success(`Employee ${actionType.toLowerCase()}d successfully!`);

        setTimeout(() => {
          handleManualRefresh();
        }, 500);
      } catch (error) {
        console.error(`Failed to ${actionType.toLowerCase()} employee:`, error);
        toast.error(
          error.message || `Failed to ${actionType.toLowerCase()} employee`
        );
      }
    }
    setShowActionModal(false);
    setSelectedUser(null);
    setActionType("");
  };

  // View user - UPDATED for employee
  const handleViewUser = async (user) => {
    try {
      await dispatch(getEmployeeById(user.id));
      setShowViewProfile(true);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to load employee details:", error);
      dispatch(setCurrentUser(user));
      setShowViewProfile(true);
      setOpenMenuId(null);
    }
  };

  // Form handlers
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedUser(null);
    handleManualRefresh();
    toast.success(
      selectedUser
        ? "Employee updated successfully!"
        : "Employee added successfully!"
    );
  };

  const handleEditProfileSuccess = () => {
    setShowEditProfile(false);
    setSelectedUser(null);
    handleManualRefresh();
    toast.success("Profile image updated successfully!");
  };

  const handleCredentialsSuccess = () => {
    setShowEditPassword(false);
    setSelectedUser(null);
    handleManualRefresh();
    toast.success("Credentials updated successfully!");
  };

  // Filter employees safely
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter(
        (employee) =>
          employee.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          employee.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          employee.email?.toLowerCase().includes(search.toLowerCase()) ||
          employee.phoneNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Export actions
  const exportActions = [
    { name: "Copy", icon: Copy },
    { name: "CSV", icon: FileText },
    { name: "Excel", icon: FileSpreadsheet },
    { name: "PDF", icon: FileText },
    { name: "Print", icon: Printer },
  ];

  // Avatar color function
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <PageHeader
          breadcrumb={["Dashboard", "Employee Management"]}
          title="Employee Management"
          description="Manage your team members and employee records"
        />
        <div className="flex gap-3 mt-4 sm:mt-0">
          <div className="flex gap-2">
            {exportActions.map((action) => (
              <button
                key={action.name}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm"
                title={action.name}
              >
                <action.icon className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">{action.name}</span>
              </button>
            ))}
          </div>
          <ButtonField
            name="Add Employee"
            isOpen={() => {
              setSelectedUser(null);
              setShowForm(true);
            }}
            icon={UserPlus}
            css
          />
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Team Employees
            </h2>
            <p className="text-gray-600">Manage and monitor your team</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-gray-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EMPLOYEE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CONTACT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROLE
              </th>
              {currentUserRole === "ADMIN" && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PASSWORD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PERMISSIONS
                  </th>
                </>
              )}

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={currentUserRole === "ADMIN" ? 8 : 6}>
                  <EmptyState type="loading" />
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={currentUserRole === "ADMIN" ? 8 : 6}>
                  <EmptyState
                    type={search ? "search" : "empty"}
                    search={search}
                  />
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee, index) => {
                const employeePerms = getEmployeeSpecificPermissions(
                  employee.id
                );

                return (
                  <tr
                    key={employee.id}
                    className="hover:bg-blue-50 transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * limit + index + 1}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-10 w-10 rounded-full ${getAvatarColor(
                            employee.firstName
                          )} flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() =>
                            employee.profileImage &&
                            setPreviewImage(employee.profileImage)
                          }
                        >
                          {employee.profileImage ? (
                            <img
                              src={employee.profileImage}
                              alt={employee.firstName || "Employee"}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            getInitials(employee.firstName, employee.lastName)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {`${employee.firstName || ""} ${
                              employee.lastName || ""
                            }`.trim()}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{employee.username}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <UsersRound className="w-3 h-3 mr-1" />
                            Parent: {employee.parent?.username || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {employee.email || "No email"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {employee.phoneNumber || "No phone"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(
                          employee.role?.name
                        )}`}
                      >
                        {getRoleDisplayName(employee.role?.name)}
                      </span>
                    </td>

                    {currentUserRole === "ADMIN" && (
                      <>
                        {/* Password Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono">
                              {showPasswords[employee.id]
                                ? employee.password
                                : "••••••••"}
                            </span>
                            <button
                              onClick={() =>
                                togglePasswordVisibility(employee.id)
                              }
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title={
                                showPasswords[employee.id] ? "Hide" : "Show"
                              }
                            >
                              {showPasswords[employee.id] ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* ✅ FIXED: Permissions Column - Now shows correct permissions per employee */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {employeePerms
                              .slice(0, 2)
                              .map((permission, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex px-2 py-1 rounded text-xs bg-green-100 text-green-800 border border-green-300"
                                >
                                  {permission.toUpperCase()}
                                </span>
                              ))}
                            {employeePerms.length > 2 && (
                              <span className="inline-flex px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 border border-gray-300">
                                +{employeePerms.length - 2} more
                              </span>
                            )}
                            {employeePerms.length === 0 && (
                              <span className="inline-flex px-2 py-1 rounded text-xs bg-gray-100 text-gray-500 border border-gray-300">
                                No permissions
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                          employee.status === "IN_ACTIVE"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : employee.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : employee.status === "DELETE"
                            ? "bg-gray-100 text-gray-800 border-gray-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }`}
                      >
                        {employee.status === "IN_ACTIVE"
                          ? "Inactive"
                          : employee.status === "ACTIVE"
                          ? "Active"
                          : employee.status === "DELETE"
                          ? "Deleted"
                          : employee.status || "Unknown"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center relative">
                      <div className="inline-block relative">
                        <button
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === employee.id ? null : employee.id
                            )
                          }
                        >
                          {openMenuId === employee.id ? (
                            <X className="w-5 h-5 text-gray-600" />
                          ) : (
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          )}
                        </button>

                        {openMenuId === employee.id && (
                          <ActionsMenu
                            type="employee"
                            user={employee}
                            isAdminUser={isAdminUser}
                            onView={handleViewUser}
                            onEdit={(employee) => {
                              setSelectedUser(employee);
                              setShowForm(true);
                              setOpenMenuId(null);
                            }}
                            onEditProfile={(employee) => {
                              setSelectedUser(employee);
                              setShowEditProfile(true);
                              setOpenMenuId(null);
                            }}
                            onEditPassword={(employee) => {
                              setSelectedUser(employee);
                              setShowEditPassword(true);
                              setOpenMenuId(null);
                            }}
                            onPermission={(employee) => {
                              handleAddPermission(employee);
                              setOpenMenuId(null);
                            }}
                            onToggleStatus={(employee) => {
                              setActionType(
                                employee.status === "IN_ACTIVE"
                                  ? "Activate"
                                  : "Deactivate"
                              );
                              setSelectedUser(employee);
                              setShowActionModal(true);
                              setOpenMenuId(null);
                            }}
                            onDelete={(employee) => {
                              setActionType("Delete");
                              setSelectedUser(employee);
                              setShowActionModal(true);
                              setOpenMenuId(null);
                            }}
                            onLogin={handleLogin}
                            onClose={() => setOpenMenuId(null)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredEmployees.length} of {totalEmployees} employees
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Active:{" "}
              {
                employees.filter((employee) => employee.status === "ACTIVE")
                  .length
              }
            </div>
            <div className="text-sm text-gray-600">
              Inactive:{" "}
              {
                employees.filter((employee) => employee.status === "IN_ACTIVE")
                  .length
              }
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* All Modals */}
      {showViewProfile && (
        <UserProfileView
          userData={viewedEmployee || selectedUser}
          isAdminUser={isAdminUser}
          onClose={() => {
            setShowViewProfile(false);
            dispatch(setCurrentUser(null));
          }}
          type={"employee"}
        />
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90%] max-h-[85%]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
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

      {showActionModal && (
        <ConfirmCard
          actionType={actionType}
          user={selectedUser}
          isClose={() => setShowActionModal(false)}
          isSubmit={confirmAction}
          predefinedReasons={[
            "Violation of terms of service",
            "Inappropriate behavior",
            "Security concerns",
            "User request",
            "Suspicious activity",
            "Account verification required",
            "Other",
          ]}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddMember
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
            editData={selectedUser}
            isAdmin={isAdminUser}
            type={"employee"}
          />
        </div>
      )}

      {showEditProfile && selectedUser && (
        <EditProfileImageModal
          user={selectedUser}
          onClose={() => {
            setShowEditProfile(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditProfileSuccess}
          type="employee"
        />
      )}

      {showEditPassword && selectedUser && (
        <EditCredentialsModal
          userId={selectedUser.id}
          type="password"
          onClose={() => {
            setShowEditPassword(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCredentialsSuccess}
        />
      )}

      {showPermissionModal && permissionUser && (
        <AddEmployeePermissions
          mode={permissionMode}
          onSubmit={handlePermissionSubmit}
          onCancel={handleClosePermissionModal}
          selectedUser={permissionUser}
          existingPermissions={existingPermissions}
        />
      )}
    </div>
  );
};

export default EmployeeTable;
