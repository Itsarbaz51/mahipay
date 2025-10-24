import { Trash2, Edit2, Users, Shield } from "lucide-react";

export function RoleList({ roles, onEdit, onDelete, onPermission }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              Role Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {roles?.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-16 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Users size={40} className="text-cyan-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600">
                    No roles found
                  </p>
                  <p className="text-sm mt-1">
                    Click "Add Role" to create your first role
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            roles?.map((role, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {idx + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {role.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-md">
                    {role.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(role, idx)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-sm"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => onPermission(role, idx)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm"
                    >
                      <Shield size={14} />
                      Permission
                    </button>
                    <button
                      onClick={() => onDelete(role)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
