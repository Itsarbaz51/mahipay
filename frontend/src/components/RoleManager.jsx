import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit, Trash2, Key } from "lucide-react";
import { RoleList } from "./tabels/RoleList";
import { RoleFormModal } from "./forms/RoleForm";
import {
  createRole,
  deleteRole,
  updateRole,
  getAllRolesByType,
  clearRoleError,
  clearRoleSuccess,
} from "../redux/slices/roleSlice";
import AddPermission from "./forms/AddPermission";
import {
  getPermissionRoleById,
  upsertRolePermission,
} from "../redux/slices/permissionSlice";
import { getServicesActive } from "../redux/slices/serviceSlice";

export default function RoleManager() {
  const dispatch = useDispatch();

  const roles = useSelector((state) => state?.roles?.roles || []);
  const { isLoading, error, success } = useSelector((state) => state.roles);
  const services =
    useSelector((state) => state.services?.serviceProviders) || [];
  const { currentPermission } = useSelector((state) => state.permission);

  const [editRole, setEditRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("employe");

  // Permission Modal States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionRole, setPermissionRole] = useState(null);
  const [existingPermissions, setExistingPermissions] = useState(null);
  const [permissionMode, setPermissionMode] = useState("role");

  // Fetch roles when component mounts and when tab changes
  useEffect(() => {
    dispatch(getAllRolesByType(activeTab));
  }, [dispatch, activeTab]);

  useEffect(() => {
    if (showPermissionModal) {
      dispatch(getServicesActive());
    }
  }, [showPermissionModal, dispatch]);

  // Clear errors/success messages when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearRoleError());
      dispatch(clearRoleSuccess());
    };
  }, [dispatch]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearRoleSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearRoleError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (
      currentPermission &&
      permissionRole &&
      (currentPermission.roleId === permissionRole.id ||
        currentPermission.userId === permissionRole.id)
    ) {
      setExistingPermissions(currentPermission);
    } else {
      setExistingPermissions(null);
    }
  }, [currentPermission, permissionRole]);

  useEffect(() => {
    if (showPermissionModal && permissionRole?.id) {
      dispatch(getPermissionRoleById(permissionRole.id));
    }
  }, [dispatch, showPermissionModal, permissionRole]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(clearRoleError());
    dispatch(clearRoleSuccess());
  };

  const handleAddOrUpdate = async (roleData) => {
    try {
      const dataWithType = {
        ...roleData,
        type: activeTab,
      };

      if (editRole) {
        await dispatch(updateRole(editRole.id, dataWithType)).unwrap();
        setEditRole(null);
      } else {
        await dispatch(createRole(dataWithType)).unwrap();
      }
      setIsModalOpen(false);
      dispatch(getAllRolesByType(activeTab));
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (role) => {
    // Sirf employe tab ke liye edit allow karen
    if (activeTab === "employe") {
      setEditRole(role);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (role) => {
    // Sirf employe tab ke liye delete allow karen
    if (activeTab === "employe") {
      if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
        try {
          await dispatch(deleteRole(role.id)).unwrap();
          dispatch(getAllRolesByType(activeTab));
        } catch (error) {
          console.error("Delete failed:", error);
        }
      }
    }
  };

  const handlePermission = (role) => {
    setPermissionRole(role);
    setShowPermissionModal(true);
    setPermissionMode("role");
    setExistingPermissions(null);

    if (role.id) {
      dispatch(getPermissionRoleById(role.id));
    }
  };

  const handlePermissionSubmit = async (permissionData) => {
    try {
      await dispatch(upsertRolePermission(permissionData)).unwrap();
      handleClosePermissionModal();
      dispatch(getAllRolesByType(activeTab));
    } catch (error) {
      console.error("Permission update failed:", error);
    }
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setPermissionRole(null);
    setExistingPermissions(null);
    setPermissionMode("role");
  };

  const handleCancel = () => {
    setEditRole(null);
    setIsModalOpen(false);
    dispatch(clearRoleError());
  };

  const handleAddNew = () => {
    setEditRole(null);
    setIsModalOpen(true);
  };

  // Filter roles based on active tab for additional safety
  const filteredRoles = roles.filter((role) => role.type === activeTab);

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {activeTab === "employe" ? "Employee Roles" : "System Roles"}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Manage and monitor your{" "}
              {activeTab === "employe" ? "employee" : "system"} roles
            </p>
          </div>

          {activeTab === "employe" && (
            <button
              onClick={handleAddNew}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
            >
              <Plus size={20} />
              {isLoading ? "Loading..." : "Create Employee Role"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => handleTabChange("employe")}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "employe"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/20"
              }`}
            >
              Employee Roles
            </button>
            <button
              onClick={() => handleTabChange("role")}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "role"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/20"
              }`}
            >
              System Roles
            </button>
          </nav>
        </div>
      </div>
      {isLoading && !filteredRoles.length && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">
            Loading {activeTab === "employe" ? "employee" : "system"} roles...
          </p>
        </div>
      )}
      {error && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}
      {!isLoading && filteredRoles.length > 0 && (
        <RoleList
          roles={filteredRoles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPermission={handlePermission}
          type={activeTab} // Yeh prop pass karen
        />
      )}
      {!isLoading && filteredRoles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <Plus size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab === "employe" ? "employee" : "system"} roles found
          </h3>
          <p className="text-gray-600 mb-4">
            {activeTab === "employe"
              ? "Get started by creating your first employee role."
              : "System roles are managed automatically."}
          </p>
          {activeTab === "employe" && (
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create Employee Role
            </button>
          )}
        </div>
      )}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onSubmit={handleAddOrUpdate}
        editData={editRole}
        isLoading={isLoading}
        type={activeTab}
      />
      {showPermissionModal && permissionRole && (
        <AddPermission
          mode={permissionMode}
          onSubmit={handlePermissionSubmit}
          onCancel={handleClosePermissionModal}
          selectedUser={permissionRole}
          services={services}
          existingPermissions={existingPermissions}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
