import React from "react";
import { Eye, Edit, Settings, LogIn, Plus, X } from "lucide-react";

const ActionsMenu = ({
  user,
  onView,
  onEdit,
  onSettings,
  onLoginAs,
  onToggleStatus,
  onClose,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
      <button
        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100"
        onClick={() => {
          onView(user);
          
        }}
      >
        <Eye className="w-4 h-4" />
        View Profile
      </button>

      <button
        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100"
        onClick={() => {
          onEdit(user);
          
        }}
      >
        <Edit className="w-4 h-4" />
        Edit
      </button>

      <button
        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100"
        onClick={() => {
          onSettings(user);
          
        }}
      >
        <Settings className="w-4 h-4" />
        Settings
      </button>

      <button
        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100"
        onClick={() => {
          onLoginAs(user);
          
        }}
      >
        <LogIn className="w-4 h-4" />
        Log In As
      </button>

      <button
        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100"
        onClick={() => {
          onToggleStatus(user);
          
        }}
      >
        {user.status === "IN_ACTIVE" ? (
          <>
            <Plus className="w-4 h-4" /> Activate
          </>
        ) : (
          <>
            <X className="w-4 h-4" /> Deactivate
          </>
        )}
      </button>
    </div>
  );
};

export default ActionsMenu;
