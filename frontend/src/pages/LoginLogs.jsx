import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Filter, MapPin, RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce } from "use-debounce";
import PageHeader from "../components/ui/PageHeader";
import { getLoginLogs } from "../redux/slices/loginLogsSlice";

// Constants
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 400;

const LoginLogs = () => {
  const dispatch = useDispatch();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced search
  const [debouncedSearch] = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Redux state
  const { logsList } = useSelector((state) => state.logs);
  const loginData = logsList?.data || [];
  const pagination = logsList?.pagination || {};

  // Fetch login logs
  const fetchLoginLogs = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsRefreshing(true);

      try {
        await dispatch(
          getLoginLogs({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: debouncedSearch,
            sort: "desc",
          })
        );
      } catch (error) {
        console.error("Failed to fetch login logs:", error);
      } finally {
        if (showLoading) setIsRefreshing(false);
      }
    },
    [dispatch, currentPage, debouncedSearch]
  );

  // Initial load and when dependencies change
  useEffect(() => {
    fetchLoginLogs();
  }, [fetchLoginLogs]);

  // Handlers
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLoginLogs(true);
  }, [fetchLoginLogs]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const getInitials = useCallback((name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, []);

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  }, []);

  const getLocationString = useCallback((log) => {
    if (log.location && log.location !== "N/A") return log.location;
    if (log.lat && log.log) return `${log.lat}, ${log.log}`;
    return "Location unavailable";
  }, []);

  // Memoized table rows
  const tableRows = useMemo(() => {
    if (!loginData.length) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-8 text-gray-500">
            No login logs found.
          </td>
        </tr>
      );
    }

    return loginData.map((log) => (
      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
              {getInitials(
                log.user.firstName + " " + log.user.lastName || "Unknown User"
              )}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {log.user.firstName + " " + log.user.lastName || "Unknown User"}
              </div>
              <div className="text-sm text-gray-500">
                ID: {log.id ? `#${log.id.substring(0, 8)}...` : "N/A"}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            {log.type || "UNKNOWN"}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded border">
            {log.ipAddress || log.ip || "N/A"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{getLocationString(log)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {log.lat && log.log
              ? `${log.lat}, ${log.log}`
              : "Coordinates unavailable"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {formatTimestamp(log.timestamp || log.createdAt)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            onClick={() => handleViewLocation(log)}
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            View Map
          </button>
        </td>
      </tr>
    ));
  }, [loginData, getInitials, formatTimestamp, getLocationString]);

  const handleViewLocation = useCallback((log) => {
    if (log.lat && log.log) {
      const mapsUrl = `https://www.google.com/maps?q=${log.lat},${log.log}`;
      window.open(mapsUrl, "_blank");
    } else {
      alert("Location coordinates not available");
    }
  }, []);

  // Pagination controls
  const PaginationControls = useMemo(() => {
    if (!pagination.totalItems || pagination.totalItems <= ITEMS_PER_PAGE) {
      return null;
    }

    const totalPages = pagination.totalPages || 1;
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(
      currentPage * ITEMS_PER_PAGE,
      pagination.totalItems
    );

    return (
      <div className="px-6 py-4 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {pagination.totalItems} logs
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, idx) => {
            const pageNum = idx + 1;
            // Show limited pagination for many pages
            if (totalPages > 7) {
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 border rounded-md text-sm transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1.5 border rounded-md text-sm transition-colors ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Next
          </button>
        </div>
      </div>
    );
  }, [pagination, currentPage, handlePageChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb={["Dashboard", "Settings", "Login Logs"]}
        title="Login Activity Logs"
        description="Monitor user login activities and locations"
      />

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
        {/* Header with Search and Filters */}
        <div className="p-6 border-b border-gray-300 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Login Activity Logs
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {pagination.totalItems
                  ? `Total logs: ${pagination.totalItems}`
                  : "Monitor user login activities and locations"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by user, IP, or location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full sm:w-64"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {PaginationControls}
      </div>
    </div>
  );
};

export default LoginLogs;
