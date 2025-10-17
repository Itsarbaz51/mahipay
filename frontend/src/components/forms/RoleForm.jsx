import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function RoleFormModal({ isOpen, onClose, onSubmit, editData }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description);
    } else {
      setName("");
      setDescription("");
    }
  }, [editData]);

  const handleNameChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z\s]/g, "");
    setName(value);
  };

  const handleSubmit = () => {
    if (!name || !description) return alert("All fields are required!");
    onSubmit({ name, description });
    setName("");
    setDescription("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData ? "Update Role" : "Add New Role"}
            </h2>
            <p className="text-cyan-50 text-sm mt-1">
              {editData
                ? "Modify role details"
                : "Create a new role for your team"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., ADMINISTRATOR"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role's responsibilities and permissions"
                rows="4"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg"
            >
              {editData ? "Update Role" : "Create Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
