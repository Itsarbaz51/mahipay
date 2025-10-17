import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { RoleList } from "./tabels/RoleList";
import { RoleFormModal } from "./forms/RoleForm";
import {
  createRole,
  deleteRoleById,
  updateRoleById,
  getAllRoles,
} from "../redux/slices/roleSlice";

export default function RoleManager() {
  const dispatch = useDispatch();
  const roles = useSelector((state) => state?.roles?.roles.roles || []);
  const [editRole, setEditRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(getAllRoles());
  }, [dispatch]);

  const handleAddOrUpdate = (roleData) => {
    console.log(editRole);
    
    if (editRole) {
      dispatch(updateRoleById(editRole.id, roleData));
      setEditRole(null);
    } else {
      dispatch(createRole(roleData));
    }
    setIsModalOpen(false);
  };

  const handleEdit = (role) => {
    setEditRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = (role) => {
    console.log(role);
    
    if (confirm("Are you sure you want to delete this role?")) {
      dispatch(deleteRoleById(role.id));
    }
  };

  const handleCancel = () => {
    setEditRole(null);
    setIsModalOpen(false);
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
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Add Role
        </button>
      </div>

      <RoleList roles={roles} onEdit={handleEdit} onDelete={handleDelete} />

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onSubmit={handleAddOrUpdate}
        editData={editRole}
      />
    </div>
  );
}
