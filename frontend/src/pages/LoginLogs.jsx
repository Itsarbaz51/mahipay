import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  MapPin,
  RefreshCw,
  Monitor,
  Smartphone,
  Filter,
  ChevronDown,
  Globe,
  User,
  ArrowUpDown,
  Building2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce } from "use-debounce";
import { getLoginLogs } from "../redux/slices/logsSlice";
import { getAllRoles } from "../redux/slices/roleSlice";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 400;

const LoginLogs = () => {
  const dispatch = useDispatch();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deviceFilterOpen, setDeviceFilterOpen] = useState(false);
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedSortBy, setSelectedSortBy] = useState("");

  const [debouncedSearch] = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Redux data
  const { logsList = {}, loading } = useSelector((state) => state.logs);
  const pagination = logsList?.pagination;
  const summary = logsList?.summary || {};

  const roles = useSelector((state) => state?.roles?.roles || []);

  useEffect(() => {
    dispatch(getAllRoles());
  }, [dispatch]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedDevice !== "" ||
      selectedRole !== "" ||
      selectedSort !== "" ||
      selectedSortBy !== "" ||
      searchTerm !== ""
    );
  }, [selectedDevice, selectedRole, selectedSort, selectedSortBy, searchTerm]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedDevice("");
    setSelectedRole("");
    setSelectedSort("");
    setSelectedSortBy("");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Fetch logs
  const fetchLoginLogs = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsRefreshing(true);
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
          deviceType: selectedDevice || "all",
          roleId: selectedRole !== "all" ? selectedRole : undefined,
          sort: selectedSort,
        };

        await dispatch(getLoginLogs(params));
      } catch (error) {
        console.error("Failed to fetch login logs:", error);
      } finally {
        if (showLoading) setIsRefreshing(false);
      }
    },
    [
      dispatch,
      currentPage,
      debouncedSearch,
      selectedDevice,
      selectedRole,
      selectedSort,
      selectedSortBy,
    ]
  );

  useEffect(() => {
    fetchLoginLogs();
  }, [fetchLoginLogs]);

  // Helpers
  const getInitials = (first, last) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;

    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (minutes < 1) {
      return "Just now";
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return "1 day ago";
    } else if (days < 7) {
      return `${days}d ago`;
    } else if (weeks === 1) {
      return "1 week ago";
    } else if (weeks < 4) {
      return `${weeks}w ago`;
    } else if (months === 1) {
      return "1 month ago";
    } else if (months < 12) {
      return `${months}mo ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getFullTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const DeviceIcon = ({ device }) =>
    device?.toLowerCase() === "mobile" ? (
      <Smartphone className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  // Filtered data - use the data directly from API (already filtered on backend)
  const filteredData = useMemo(() => {
    return Array.isArray(logsList?.data) ? logsList.data : [];
  }, [logsList?.data]);

  const handleRefresh = () => fetchLoginLogs(true);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchLoginLogs();
  };

  const handleDeviceFilterChange = (device) => {
    setSelectedDevice(device);
    setCurrentPage(1);
    setDeviceFilterOpen(false);
  };

  const handleRoleFilterChange = (roleId) => {
    setSelectedRole(roleId);
    setCurrentPage(1);
    setRoleFilterOpen(false);
  };

  const handleSortChange = (sort, sortBy) => {
    setSelectedSort(sort);
    setSelectedSortBy(sortBy);
    setCurrentPage(1);
    setSortOpen(false);
  };

  const getSortLabel = () => {
    const sortByLabels = {
      createdAt: "Time",
      user: "User",
      ipAddress: "IP Address",
      location: "Location",
    };

    const sortLabels = {
      asc: "Ascending",
      desc: "Descending",
    };

    return `${sortByLabels[selectedSortBy]} (${sortLabels[selectedSort]})`;
  };

  // Pagination controls
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Previous
        </button>

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === pagination.totalPages ||
              Math.abs(page - currentPage) <= 1
          )
          .map((page, index, array) => {
            // Add ellipsis for gaps in pagination
            const showEllipsis = index > 0 && page - array[index - 1] > 1;
            return (
              <div key={page} className="flex items-center gap-1">
                {showEllipsis && <span className="px-2">...</span>}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg border ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              </div>
            );
          })}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.totalPages}
          className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Summary cards */}
      {summary?.totalLogs !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Logs",
              value: summary.totalLogs,
              icon: Globe,
              color: "blue",
            },
            {
              label: "Desktop",
              value: summary.desktopLogs,
              icon: Monitor,
              color: "purple",
            },
            {
              label: "Mobile",
              value: summary.mobileLogs,
              icon: Smartphone,
              color: "green",
            },
            {
              label: "Unique Users",
              value: summary.uniqueUsers,
              icon: null,
              emoji: "👤",
              color: "orange",
            },
          ].map(({ label, value, icon: Icon, emoji, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {value ?? 0}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl ${
                    color === "blue"
                      ? "bg-blue-100"
                      : color === "purple"
                      ? "bg-purple-100"
                      : color === "green"
                      ? "bg-green-100"
                      : "bg-orange-100"
                  } flex items-center justify-center`}
                >
                  {Icon ? (
                    <Icon
                      className={`h-6 w-6 ${
                        color === "blue"
                          ? "text-blue-600"
                          : color === "purple"
                          ? "text-purple-600"
                          : color === "green"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users, IPs, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3">
            {/* Device Filter */}
            <div className="relative">
              <button
                onClick={() => setDeviceFilterOpen(!deviceFilterOpen)}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <Monitor className="h-4 w-4" />
                Device
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    deviceFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {deviceFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Device Type
                    </div>
                    {["all", "desktop", "mobile"].map((device) => (
                      <button
                        key={device}
                        onClick={() => handleDeviceFilterChange(device)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedDevice === device
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {device.charAt(0).toUpperCase() + device.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role Filter */}
            <div className="relative">
              <button
                onClick={() => setRoleFilterOpen(!roleFilterOpen)}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <User className="h-4 w-4" />
                Role
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    roleFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {roleFilterOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      User Role
                    </div>
                    <button
                      onClick={() => handleRoleFilterChange("all")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedRole === "all"
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      All Roles
                    </button>
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleRoleFilterChange(role.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedRole === role.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <ArrowUpDown className="h-4 w-4" />
                {selectedSort ? selectedSort.toUpperCase() : "Sort"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    sortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Sort Order
                    </div>
                    {["asc", "desc"].map((order) => (
                      <button
                        key={order}
                        onClick={() => {
                          setSelectedSort(order);
                          setSortOpen(false);
                          fetchLoginLogs();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedSort === order
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {order.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button - Only show when filters are active */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedDevice !== "all" ||
          selectedRole !== "all" ||
          selectedSortBy !== "createdAt" ||
          selectedSort !== "desc" ||
          searchTerm) && (
          <div className="px-6 py-3 border-b border-slate-200 bg-blue-50">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Active filters:</span>
              {selectedDevice !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  Device: {selectedDevice}
                  <button
                    onClick={() => handleDeviceFilterChange("all")}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedRole !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  Role:{" "}
                  {roles.find((r) => r.id === selectedRole)?.name ||
                    selectedRole}
                  <button
                    onClick={() => handleRoleFilterChange("all")}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {(selectedSortBy !== "createdAt" || selectedSort !== "desc") && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  Sort: {getSortLabel()}
                  <button
                    onClick={() => handleSortChange("desc", "createdAt")}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "User",
                  "Role",
                  "Role Type",
                  "Device & Browser",
                  "IP",
                  "Location",
                  "Time",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredData.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(log.user?.firstName, log.user?.lastName)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {log.user?.firstName} {log.user?.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {log.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {log.user?.role?.name || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Level {log.user?.role?.level || 0}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          {log.roleType === "employee" ? (
                            <User className="h-4 w-4" />
                          ) : log.roleType === "business" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {log.roleType || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <DeviceIcon device={log.userAgentSimple?.device} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {log.userAgentSimple?.browser || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {log.userAgentSimple?.os || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-800">
                      {log.ipAddress || "N/A"}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {log.location || "Unknown"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      title={getFullTimestamp(log.createdAt)}
                    >
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          log.latitude &&
                          window.open(
                            `https://www.google.com/maps?q=${log.latitude},${log.longitude}`,
                            "_blank"
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium  transition"
                      >
                        <MapPin className="h-4 w-4" />
                        View Map
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {renderPagination()}

            <span className="text-xs text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLogs;
