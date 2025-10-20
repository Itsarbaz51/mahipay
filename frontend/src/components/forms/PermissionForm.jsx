import React, { useState, useEffect, useRef } from "react";

const PermissionForm = ({
  mode,
  permission,
  onSubmit,
  onCancel,
  roles,
  users,
  selectedUser,
  setSelectedUser,
  services,
  existingPermissions = [],
}) => {
  const [formData, setFormData] = useState({
    userId: selectedUser?.id || "",
    serviceId: [],
    canView: false,
    canEdit: false,
    canSetCommission: false,
  });

  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceSearchRef = useRef(null);
  const userSearchRef = useRef(null);

  // Load existing permissions for the user
  useEffect(() => {
    if (selectedUser && existingPermissions.length > 0) {
      const userPerms = existingPermissions.filter(
        (perm) => perm.userId === selectedUser.id
      );
      setUserPermissions(userPerms);

      // Auto-fill form with existing permissions data
      if (userPerms.length > 0) {
        // Get unique permission settings (assuming they're consistent across services)
        const firstPerm = userPerms[0];
        const allServiceIds = userPerms.map((perm) => perm.serviceId);

        setFormData({
          userId: firstPerm.userId,
          serviceId: allServiceIds,
          canView: firstPerm.canView,
          canEdit: firstPerm.canEdit,
          canSetCommission: firstPerm.canSetCommission,
        });
      }
    }
  }, [selectedUser, existingPermissions]);

  // Setup form based on mode
  useEffect(() => {
    if (mode === "edit" && permission) {
      const newFormData = {
        userId: permission.userId || "",
        serviceId: permission.serviceId || [],
        canView: permission.canView || false,
        canEdit: permission.canEdit || false,
        canSetCommission: permission.canSetCommission || false,
      };

      setFormData(newFormData);

      if (permission.userId) {
        const user = users?.find((u) => u.id === permission.userId);
        setSelectedUser(user || { id: permission.userId });
        setUserSearchTerm(user?.firstName || user?.email || permission.userId);
      }
    } else if (mode === "add") {
      // Reset for add mode
      setFormData({
        userId: selectedUser?.id || "",
        serviceId: [],
        canView: false,
        canEdit: false,
        canSetCommission: false,
      });
      setUserPermissions([]);
      setUserSearchTerm(
        selectedUser
          ? `${selectedUser.firstName || ""} ${
              selectedUser.lastName || ""
            }`.trim()
          : ""
      );
      setServiceSearchTerm("");
    }
  }, [mode, permission, users, setSelectedUser, selectedUser]);

  // Filter services based on search
  const filteredServices = services?.filter(
    (service) =>
      service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  // Filter users based on search
  const filteredUsers = users?.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.phoneNumber?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleServiceSelect = (service) => {
    if (!formData.serviceId.includes(service.id)) {
      setFormData((prev) => ({
        ...prev,
        serviceId: [...prev.serviceId, service.id],
      }));
    }
    setServiceSearchTerm("");
    setShowServiceSuggestions(false);
  };

  const handleServiceRemove = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceId: prev.serviceId.filter((id) => id !== serviceId),
    }));
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      userId: user.id,
    }));
    setUserSearchTerm(`${user.firstName} ${user.lastName || ""}`.trim());
    setShowUserSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.serviceId.length === 0) {
      alert("Please select at least one service");
      return;
    }

    if (!formData.userId) {
      alert("Please select a user");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data according to your API structure
      const permissionData = {
        userId: formData.userId,
        serviceId: formData.serviceId,
        canView: formData.canView,
        canEdit: formData.canEdit,
        canSetCommission: formData.canSetCommission,
      };

      console.log("Submitting permission data:", permissionData);
      await onSubmit(permissionData);
    } catch (error) {
      console.error("Failed to submit permission:", error);
      // You might want to show an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getSelectedServiceNames = () => {
    return formData.serviceId.map((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return service ? service.name : serviceId;
    });
  };

  const getServicePermissionStatus = (serviceId) => {
    const perm = userPermissions.find((p) => p.serviceId === serviceId);
    if (!perm) return null;

    return {
      canView: perm.canView,
      canEdit: perm.canEdit,
      canSetCommission: perm.canSetCommission,
    };
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        serviceSearchRef.current &&
        !serviceSearchRef.current.contains(event.target)
      ) {
        setShowServiceSuggestions(false);
      }
      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target)
      ) {
        setShowUserSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {mode === "add" ? "Add User Permission" : "Edit User Permission"}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User *
              </label>
              <div className="relative" ref={userSearchRef}>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setShowUserSuggestions(true);
                  }}
                  onFocus={() => setShowUserSuggestions(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search users by name, email, or phone..."
                  disabled={mode === "edit" || isSubmitting}
                />

                {/* User Suggestions */}
                {showUserSuggestions && userSearchTerm && mode !== "edit" && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName || ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email} • {user.phoneNumber}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.role?.name || "No role"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected User Info */}
              {selectedUser && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm font-medium text-blue-800">
                    Selected: {selectedUser.firstName}{" "}
                    {selectedUser.lastName || ""}
                  </div>
                  <div className="text-xs text-blue-600">
                    {selectedUser.email} • {selectedUser.phoneNumber}
                  </div>
                  {mode === "edit" && userPermissions.length > 0 && (
                    <div className="text-xs text-blue-500 mt-1">
                      {userPermissions.length} existing permission(s) will be
                      updated
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Services *
                <span className="text-xs text-gray-500 ml-2">
                  (Multiple selection allowed)
                </span>
              </label>

              {/* Selected Services */}
              {formData.serviceId.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Selected Services ({formData.serviceId.length}):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedServiceNames().map((serviceName, index) => {
                      const serviceId = formData.serviceId[index];
                      const existingPerm =
                        getServicePermissionStatus(serviceId);

                      return (
                        <span
                          key={serviceId}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                            existingPerm
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {serviceName}
                          {existingPerm && (
                            <span className="ml-1 text-xs">(existing)</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleServiceRemove(serviceId)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service Search Input */}
              <div className="relative" ref={serviceSearchRef}>
                <input
                  type="text"
                  value={serviceSearchTerm}
                  onChange={(e) => {
                    setServiceSearchTerm(e.target.value);
                    setShowServiceSuggestions(true);
                  }}
                  onFocus={() => setShowServiceSuggestions(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search services by name or ID..."
                  disabled={isSubmitting}
                />

                {/* Service Suggestions */}
                {showServiceSuggestions && serviceSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredServices && filteredServices.length > 0 ? (
                      filteredServices.map((service) => {
                        const existingPerm = getServicePermissionStatus(
                          service.id
                        );

                        return (
                          <div
                            key={service.id}
                            onClick={() => handleServiceSelect(service)}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              existingPerm ? "bg-green-50" : ""
                            }`}
                          >
                            <div className="font-medium text-gray-900 flex items-center justify-between">
                              {service.name}
                              {existingPerm && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Existing
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {service.id}
                            </div>
                            {existingPerm && (
                              <div className="text-xs text-gray-600 mt-1">
                                View: {existingPerm.canView ? "✓" : "✗"} | Edit:{" "}
                                {existingPerm.canEdit ? "✓" : "✗"} | Commission:{" "}
                                {existingPerm.canSetCommission ? "✓" : "✗"}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No services found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Checkboxes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
                {mode === "edit" && userPermissions.length > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Updating {userPermissions.length} permission(s))
                  </span>
                )}
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canView}
                  onChange={(e) =>
                    handleInputChange("canView", e.target.checked)
                  }
                  className="mr-2 rounded"
                  disabled={isSubmitting}
                />
                Can View
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canEdit}
                  onChange={(e) =>
                    handleInputChange("canEdit", e.target.checked)
                  }
                  className="mr-2 rounded"
                  disabled={isSubmitting}
                />
                Can Edit
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canSetCommission}
                  onChange={(e) =>
                    handleInputChange("canSetCommission", e.target.checked)
                  }
                  className="mr-2 rounded"
                  disabled={isSubmitting}
                />
                Can Set Commission
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : mode === "add" ? (
                  "Add Permission"
                ) : (
                  "Update Permission"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PermissionForm;
