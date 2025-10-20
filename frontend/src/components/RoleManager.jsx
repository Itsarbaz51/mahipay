import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { RoleList } from "./tabels/RoleList";
import { RoleFormModal } from "./forms/RoleForm";
import {
  createRole,
  deleteRole,
  updateRole,
  getAllRoles,
} from "../redux/slices/roleSlice";

export default function RoleManager() {
  const dispatch = useDispatch();
  const roles = useSelector((state) => state?.roles?.roles || []);
  const { isLoading, error, success } = useSelector((state) => state.roles);

  const [editRole, setEditRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(getAllRoles());
  }, [dispatch]);

  // Handle success messages
  useEffect(() => {
    if (success) {
      console.log("Success:", success);
      // You can show a toast notification here if needed
    }
  }, [success]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error:", error);
      // Error is already shown via toast in the slice
    }
  }, [error]);

  const handleAddOrUpdate = async (roleData) => {
    try {
      if (editRole) {
        await dispatch(updateRole(editRole.id, roleData)).unwrap();
        setEditRole(null);
      } else {
        await dispatch(createRole(roleData)).unwrap();
      }
      setIsModalOpen(false);

      // Refresh the roles list after successful operation
      dispatch(getAllRoles());
    } catch (error) {
      // Error is already handled in the slice
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (role) => {
    setEditRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = async (role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        await dispatch(deleteRole(role.id)).unwrap();
        // Roles list will be automatically updated in Redux state
      } catch (error) {
        // Error is already handled in the slice
        console.error("Delete failed:", error);
      }
    }
  };

  const handleCancel = () => {
    setEditRole(null);
    setIsModalOpen(false);
  };

  const handleAddNew = () => {
    setEditRole(null);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Roles</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage and monitor your roles
          </p>
        </div>

        <button
          onClick={handleAddNew}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          {isLoading ? "Loading..." : "Add Role"}
        </button>
      </div>

      {/* Show loading state */}
      {isLoading && !roles.length && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading roles...</p>
        </div>
      )}

      {/* Show error state */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Show success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Roles list */}
      {!isLoading && roles.length > 0 && (
        <RoleList
          roles={roles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      )}

      {/* Empty state */}
      {!isLoading && roles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No roles found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first role.
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Create Role
          </button>
        </div>
      )}

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onSubmit={handleAddOrUpdate}
        editData={editRole}
        isLoading={isLoading}
      />
    </div>
  );
}
