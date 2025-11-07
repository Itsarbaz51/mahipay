// AddEmployeePermissions.js
import { useState, useEffect } from "react";

const AddEmployeePermissions = ({
  mode,
  onSubmit,
  onCancel,
  selectedUser,
  existingPermissions = [],
  isLoading = false,
}) => {
  const [permissions, setPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Set existing permissions when component mounts or mode changes
    if (existingPermissions && Array.isArray(existingPermissions)) {
      setPermissions(existingPermissions);
    } else {
      setPermissions([]);
    }
  }, [existingPermissions, mode]);

  const handleRemovePermission = (permissionToRemove) => {
    setPermissions((prev) => prev.filter((p) => p !== permissionToRemove));
  };

  const handleAddPermission = (permission) => {
    if (!permissions.includes(permission) && permissions.length < 20) {
      setPermissions((prev) => [...prev, permission]);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (permissions.length === 0) {
      setError("Please add at least one permission");
      return;
    }

    if (permissions.length > 20) {
      setError("Cannot assign more than 20 permissions");
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure permissions is always an array, even if empty
      const permissionsToSubmit = Array.isArray(permissions) ? permissions : [];

      // Validate that we have permissions to submit
      if (permissionsToSubmit.length === 0) {
        throw new Error("No valid permissions to submit");
      }

      await onSubmit(permissionsToSubmit);
      // Success handling is done in parent component
    } catch (error) {
      console.error("Failed to submit permissions:", error);
      setError(error.message || "Failed to update permissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure permissions is always an array for rendering
  const safePermissions = Array.isArray(permissions) ? permissions : [];

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {mode === "add"
                ? "Add Employee Permissions"
                : "Edit Employee Permissions"}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {selectedUser?.firstName} {selectedUser?.lastName || ""}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selectedUser?.email} • {selectedUser?.phoneNumber}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  User ID: {selectedUser?.id}
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permissions *
                <span className="text-xs text-gray-500 ml-2">
                  (Max 20 permissions allowed)
                </span>
              </label>

              {/* Selected Permissions */}
              {safePermissions.length > 0 ? (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Selected Permissions ({safePermissions.length}):
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {safePermissions.map((permission, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300"
                      >
                        {permission.toUpperCase()}
                        <button
                          type="button"
                          onClick={() => handleRemovePermission(permission)}
                          className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-center">
                  <p className="text-sm text-gray-500">
                    No permissions selected
                  </p>
                </div>
              )}

              {safePermissions.length >= 20 && (
                <div className="text-xs text-red-500 mt-1">
                  Maximum 20 permissions reached
                </div>
              )}
            </div>

            {/* Common Permissions Suggestions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Click to add permissions:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "dashboard",
                  "transactions",
                  "commission",
                  "reports",
                  "kyc request",
                  "members",
                  "settings",
                  "profile",
                  "logs",
                ].map((commonPermission) => (
                  <button
                    key={commonPermission}
                    type="button"
                    onClick={() => handleAddPermission(commonPermission)}
                    disabled={
                      safePermissions.includes(commonPermission) ||
                      safePermissions.length >= 20 ||
                      isSubmitting
                    }
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      safePermissions.includes(commonPermission)
                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {commonPermission.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                disabled={
                  isSubmitting || isLoading || safePermissions.length === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : mode === "add" ? (
                  "Add Permissions"
                ) : (
                  "Update Permissions"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePermissions;
