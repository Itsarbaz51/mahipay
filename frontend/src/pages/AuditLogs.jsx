import { useDebounce } from "use-debounce";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Shield,
  User,
  Clock,
  Monitor,
  Globe,
  ChevronDown,
  ChevronUp,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { getAuditLogs } from "../redux/slices/logsSlice";
import { getAllRoles } from "../redux/slices/roleSlice";

const AuditLogs = () => {
  const dispatch = useDispatch();
  const { logsList, loading, error } = useSelector((state) => state.logs);

  const [expandedLog, setExpandedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // 500ms debounce
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [deviceFilterOpen, setDeviceFilterOpen] = useState(false);
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [filters, setFilters] = useState({
    deviceType: "all",
    roleId: "",
    sort: "desc",
    sortBy: "timestamp",
    startDate: "",
    endDate: "",
    browser: "",
    os: "",
  });

  // Get current user from auth state
  const { currentUser } = useSelector((state) => state.auth);
  const roles = useSelector((state) => state?.roles?.roles || []);

  useEffect(() => {
    dispatch(getAllRoles());
  }, [dispatch]);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, debouncedSearchTerm, filters]);

  const fetchLogs = () => {
    const params = {
      page: currentPage,
      limit: 10,
      search: debouncedSearchTerm, // Use debounced search term
      ...filters,
    };

    // If user is not admin, filter by their user ID
    if (currentUser?.role?.type !== "ADMIN") {
      params.userId = currentUser?.id;
    }

    dispatch(getAuditLogs(params));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action) => {
    if (action?.includes("SUCCESS")) return "text-green-600";
    if (action?.includes("FAILED")) return "text-red-600";
    return "text-blue-600";
  };

  const getActionBg = (action) => {
    if (action?.includes("SUCCESS")) return "bg-green-50 border-green-200";
    if (action?.includes("FAILED")) return "bg-red-50 border-red-200";
    return "bg-blue-50 border-blue-200";
  };

  // Calculate showing from/to values
  const getShowingFrom = () => {
    if (!logsList?.data.pagination) return 0;
    return logsList.data.pagination.showingFrom || 1;
  };

  const getShowingTo = () => {
    if (!logsList?.data.pagination) return 0;
    return logsList.data.pagination.showingTo || 0;
  };

  // Handle search with debounce
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  // Handle device filter change
  const handleDeviceFilterChange = (deviceType) => {
    handleFilterChange("deviceType", deviceType);
    setDeviceFilterOpen(false);
  };

  // Handle role filter change - fixed the parameter issue
  const handleRoleFilterChange = (roleId) => {
    handleFilterChange("roleId", roleId);
    setRoleFilterOpen(false);
  };

  // Handle sort change
  const handleSortChange = (sort) => {
    handleFilterChange("sort", sort);
    setSortOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      deviceType: "all",
      roleId: "",
      sort: "desc",
      sortBy: "timestamp",
      startDate: "",
      endDate: "",
      browser: "",
      os: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchLogs();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deviceFilterOpen && !event.target.closest(".device-filter")) {
        setDeviceFilterOpen(false);
      }
      if (roleFilterOpen && !event.target.closest(".role-filter")) {
        setRoleFilterOpen(false);
      }
      if (sortOpen && !event.target.closest(".sort-filter")) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [deviceFilterOpen, roleFilterOpen, sortOpen]);

  // Render pagination controls
  const renderPagination = () => {
    if (!logsList?.data.pagination) return null;

    const { pagination } = logsList.data;

    // Use the correct property names
    const currentPageNum = pagination.currentPage || pagination.page || 1;
    const totalPages = pagination.totalPages || 1;
    const hasNext = pagination.hasNext || false;
    const hasPrev = pagination.hasPrev || false;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      currentPageNum - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => setCurrentPage(currentPageNum - 1)}
        disabled={!hasPrev}
        className={`px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium flex items-center gap-1 ${
          !hasPrev
            ? "text-slate-400 cursor-not-allowed bg-slate-100"
            : "text-slate-700 hover:bg-slate-50 hover:border-slate-400"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={`px-3 py-1 rounded-lg border text-sm font-medium ${
            1 === currentPageNum
              ? "bg-blue-500 text-white border-blue-500"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 text-slate-500">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-lg border text-sm font-medium ${
            i === currentPageNum
              ? "bg-blue-500 text-white border-blue-500"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 text-slate-500">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-3 py-1 rounded-lg border text-sm font-medium ${
            totalPages === currentPageNum
              ? "bg-blue-500 text-white border-blue-500"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => setCurrentPage(currentPageNum + 1)}
        disabled={!hasNext}
        className={`px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium flex items-center gap-1 ${
          !hasNext
            ? "text-slate-400 cursor-not-allowed bg-slate-100"
            : "text-slate-700 hover:bg-slate-50 hover:border-slate-400"
        }`}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    );

    return (
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {pages}
      </div>
    );
  };

  // Calculate stats
  const calculateStats = () => {
    if (
      !logsList?.data?.paginatedLogs ||
      !Array.isArray(logsList?.data?.paginatedLogs)
    ) {
      return { totalEvents: 0, successRate: 0, activeUsers: 0, ipAddresses: 0 };
    }

    const totalEvents =
      logsList.pagination?.totalItems ||
      logsList.pagination?.totalCount ||
      logsList?.data?.paginatedLogs.length ||
      0;
    const successEvents = logsList?.data?.paginatedLogs.filter((log) =>
      log.message?.action?.includes("SUCCESS")
    ).length;
    const successRate =
      totalEvents > 0 ? (successEvents / totalEvents) * 100 : 0;

    const uniqueUsers = new Set(
      logsList?.data?.paginatedLogs.map((log) => log.user?.id).filter(Boolean)
    ).size;

    const uniqueIPs = new Set(
      logsList?.data?.paginatedLogs
        .map((log) => log.message?.ipAddress)
        .filter(Boolean)
    ).size;

    return {
      totalEvents,
      successRate: Math.round(successRate),
      activeUsers: uniqueUsers,
      ipAddresses: uniqueIPs,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Filters */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search users, IPs, locations..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-3">
          {/* Device Filter */}
          <div className="relative device-filter">
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
                  {["all", "desktop", "mobile", "tablet"].map((device) => (
                    <button
                      key={device}
                      onClick={() => handleDeviceFilterChange(device)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.deviceType === device
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {device === "all"
                        ? "All Devices"
                        : device.charAt(0).toUpperCase() + device.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Filter - Fixed */}
          <div className="relative role-filter">
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
                    onClick={() => handleRoleFilterChange("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.roleId === ""
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    All Roles
                  </button>
                  {roles?.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleFilterChange(role.id)} // Pass role.id instead of role object
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.roleId === role.id
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
          <div className="relative sort-filter">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
            >
              <ArrowUpDown className="h-4 w-4" />
              {filters.sort ? filters.sort.toUpperCase() : "Sort"}
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
                      onClick={() => handleSortChange(order)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.sort === order
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

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Rest of the component remains the same */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-gray-600 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEvents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.activeUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-cyan-600" />
            <div>
              <p className="text-gray-600 text-sm">IP Addresses</p>
              <p className="text-2xl font-bold text-cyan-600">
                {stats.ipAddresses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mx-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logsList?.data?.paginatedLogs &&
              logsList?.data?.paginatedLogs.length > 0 ? (
                logsList?.data?.paginatedLogs.map((log, index) => (
                  <React.Fragment key={index}>
                    <tr className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        {getShowingFrom() + index}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {log.user?.firstName?.[0] || "U"}
                            {log.user?.lastName?.[0] || "S"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {log.user?.firstName} {log.user?.lastName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {log.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionBg(
                            log.message?.action
                          )} ${getActionColor(log.message?.action)}`}
                        >
                          {log.message?.action?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {log.message?.metadata?.roleName ||
                            log.user?.role?.name ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {formatTime(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Globe className="w-4 h-4 text-gray-500" />
                          {log.message?.ipAddress || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Monitor className="w-4 h-4 text-gray-500" />
                          {log.message?.metadata?.userAgent?.device?.type ||
                            "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            setExpandedLog(expandedLog === index ? null : index)
                          }
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          {expandedLog === index ? (
                            <ChevronUp className="w-5 h-5 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedLog === index && (
                      <tr className="bg-blue-50">
                        <td colSpan="8" className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Device Information */}
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-3">
                                <Monitor className="w-4 h-4 text-blue-600" />
                                Device Information
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Browser:
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {log.message?.metadata?.userAgent?.browser
                                      ?.name || "N/A"}{" "}
                                    {log.message?.metadata?.userAgent?.browser
                                      ?.version || ""}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Device:</span>
                                  <span className="text-gray-900 font-medium">
                                    {log.message?.metadata?.userAgent?.device
                                      ?.type || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">OS:</span>
                                  <span className="text-gray-900 font-medium">
                                    {log.message?.metadata?.userAgent?.device
                                      ?.os || "N/A"}{" "}
                                    {log.message?.metadata?.userAgent?.device
                                      ?.osVersion || ""}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Request Details */}
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4 text-blue-600" />
                                Request Details
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Method:</span>
                                  <span className="text-gray-900 font-mono font-medium">
                                    {log.message?.metadata?.method || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Endpoint:
                                  </span>
                                  <span className="text-gray-900 font-mono text-xs font-medium">
                                    {log.message?.metadata?.url || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <span className="text-green-600 font-semibold">
                                    {log.message?.metadata?.statusCode || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsList?.data.pagination &&
          logsList?.data.pagination?.totalItems > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm text-slate-600">
                  Showing {getShowingFrom()} to {getShowingTo()} of{" "}
                  {logsList.data.pagination.totalItems} logs
                </span>

                {renderPagination()}

                <span className="text-xs text-slate-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AuditLogs;
