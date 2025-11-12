import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allServices, toggleStatusService } from "../redux/slices/serviceSlice";

export default function ManageServices() {
  const dispatch = useDispatch();
  const { serviceProviders, isLoading } = useSelector(
    (state) => state.services
  );

  const allServiceProviders = Array.isArray(serviceProviders)
    ? serviceProviders
    : [];

  const [localLoading, setLocalLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(allServices("allServices"));
  }, [dispatch]);

  const toggleService = async (serviceId, currentStatus, isParent = false) => {
    try {
      setLocalLoading((prev) => ({ ...prev, [serviceId]: true }));
      const newStatus = !currentStatus;

      // Toggle parent or sub-service
      await dispatch(toggleStatusService(serviceId));

      // If this is a parent, also toggle all its sub-services
      if (isParent) {
        const parent = allServiceProviders.find((s) => s.id === serviceId);
        if (parent && parent.subService?.length > 0) {
          for (const sub of parent.subService) {
            // Make sure child matches parent toggle
            if (sub.isActive !== newStatus) {
              await dispatch(toggleStatusService(sub.id));
            }
          }
        }
      } else {
        // If toggling a sub-service, check if all siblings share same state
        const parent = allServiceProviders.find((s) =>
          s.subService?.some((sub) => sub.id === serviceId)
        );

        if (parent) {
          const allSubSameState = parent.subService.every((sub) =>
            sub.id === serviceId ? newStatus : sub.isActive === newStatus
          );

          // If all sub-services are now same state, toggle parent to match
          if (allSubSameState && parent.isActive !== newStatus) {
            await dispatch(toggleStatusService(parent.id));
          }
        }
      }

      // Refresh hierarchy
      await dispatch(allServices("allServices"));
    } catch (error) {
      console.error("Error toggling service:", error);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(allServices("allServices"));
    } catch (error) {
      console.error("Error refreshing services:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && allServiceProviders?.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoading && allServiceProviders?.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Services Found
          </h3>
          <p className="text-gray-600">
            You haven't created any service providers yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Services</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {refreshing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allServiceProviders?.map((serviceProvider) => {
          const isActive = serviceProvider.isActive;
          const isServiceLoading = localLoading[serviceProvider.id];
          const hasSubServices =
            serviceProvider.subService && serviceProvider.subService.length > 0;
          const isParent = serviceProvider.parentId === null;

          return (
            <div
              key={serviceProvider.id}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 h-fit ${
                isActive
                  ? "bg-white border-blue-200 shadow-lg shadow-blue-100"
                  : "bg-gray-50 border-red-200 shadow-sm"
              } ${isServiceLoading ? "opacity-50" : ""}`}
            >
              {/* Main Service Provider */}
              <div
                className={`cursor-pointer group ${
                  isServiceLoading ? "pointer-events-none" : ""
                }`}
                onClick={() =>
                  toggleService(serviceProvider.id, isActive, isParent)
                }
              >
                <div className="mb-4">
                  {isParent && (
                    <p className="text-blue-600 text-xs mt-1 font-medium">
                      Parent Service
                    </p>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {serviceProvider.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-blue-600" : "text-red-500"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>

                  <div className="relative">
                    <div
                      className={`relative  inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        isActive ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                    {isServiceLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/5 group-hover:to-purple-400/5 transition-all duration-300" />
              </div>

              {/* Sub Services */}
              {hasSubServices && (
                <>
                  <div className="my-4 border-t border-gray-200" />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Sub Services:
                    </h4>
                    {serviceProvider.subService.map((subService, index) => {
                      const isSubActive = subService.isActive;
                      const isSubLoading = localLoading[subService.id];

                      return (
                        <div
                          key={subService.id}
                          className={`flex justify-between items-center p-3 rounded-lg border transition-all duration-200 ${
                            isSubActive
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-100 border-gray-200"
                          } ${
                            isSubLoading
                              ? "opacity-50 pointer-events-none"
                              : "cursor-pointer"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleService(subService.id, isSubActive, false);
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                              {index + 1}
                            </span>
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {subService.name}
                              </span>
                              <p className="text-xs text-gray-500">
                                {subService.type}
                              </p>
                            </div>
                          </div>

                          <div className="relative">
                            <div
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                                isSubActive ? "bg-blue-500" : "bg-gray-400"
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                                  isSubActive
                                    ? "translate-x-5"
                                    : "translate-x-1"
                                }`}
                              />
                            </div>
                            {isSubLoading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Status Consistency Warning */}
              {hasSubServices && isParent && (
                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Toggling this parent service will{" "}
                    {isActive ? "deactivate" : "activate"} all sub-services
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
