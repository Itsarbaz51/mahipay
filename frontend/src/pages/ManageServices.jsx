import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getServiceProvidersByUser,
  toggleServiceProviderStatus,
} from "../redux/slices/serviceSlice";

export default function ManageServices() {
  const dispatch = useDispatch();
  const { serviceProviders, isLoading } = useSelector(
    (state) => state.services
  );

  const [localLoading, setLocalLoading] = useState({});

  useEffect(() => {
    dispatch(getServiceProvidersByUser());
  }, [dispatch]);

  const toggleService = async (serviceId, currentStatus) => {
    try {
      setLocalLoading((prev) => ({ ...prev, [serviceId]: true }));

      // Toggle the status
      const newStatus = !currentStatus;

      // Dispatch the API call
      await dispatch(
        toggleServiceProviderStatus(serviceId, newStatus)
      ).unwrap();

      // Refresh the list to get updated data
      await dispatch(getServiceProvidersByUser()).unwrap();
    } catch (error) {
      console.error("Error toggling service:", error);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  if (isLoading && serviceProviders.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Agar koi service provider nahi hai
  if (!isLoading && serviceProviders.length === 0) {
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {serviceProviders.map((serviceProvider) => {
        const isActive = serviceProvider.isActive;
        const isServiceLoading = localLoading[serviceProvider.id];

        return (
          <div
            key={serviceProvider.id}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
              isActive
                ? "bg-white border-blue-200 shadow-lg shadow-blue-100"
                : "bg-gray-50 border-red-200 shadow-sm"
            } ${isServiceLoading ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() =>
              !isServiceLoading && toggleService(serviceProvider.id, isActive)
            }
          >
            {/* Service Content */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {serviceProvider.type}
              </h3>
            </div>

            {/* Toggle Switch */}
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
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
        );
      })}
    </div>
  );
}
