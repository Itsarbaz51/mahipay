import {
  Edit,
  Key,
  CreditCard,
  User,
  Power,
  Shield,
  Trash2,
  KeyRound,
} from "lucide-react";

const ActionsMenu = ({
  user,
  onView,
  onEditProfile,
  onEdit,
  onEditPassword,
  onEditPin,
  onToggleStatus,
  onClose,
  onPermission,
  onDelete,
  onLogin,
  isAdminUser, // 🆕 Added prop to check if current user is admin
}) => {
  // 🆕 Base menu items that everyone can see
  const baseMenuItems = [
    {
      icon: User,
      label: "View Profile",
      onClick: () => onView(user),
      color: "text-blue-600",
    },
  ];

  // 🆕 Admin-only menu items
  const adminMenuItems = [
    {
      icon: User,
      label: "Change Profile",
      onClick: () => onEditProfile(user),
      color: "text-green-600",
    },
    {
      icon: Edit,
      label: "Edit Profile",
      onClick: () => onEdit(user),
      color: "text-purple-600",
    },
    {
      icon: Key,
      label: "Change Password",
      onClick: () => onEditPassword(user),
      color: "text-orange-600",
    },
    {
      icon: Shield,
      label: "Add Permission",
      onClick: () => onPermission(user),
      color: "text-indigo-600",
    },
    {
      icon: CreditCard,
      label: "Change PIN",
      onClick: () => onEditPin(user),
      color: "text-red-600",
    },
    {
      icon: Power,
      label:
        user.status === "ACTIVE" || user.status === "DELETE"
          ? "Deactivate"
          : "Activate",
      onClick: () => onToggleStatus(user),
      color:
        user.status === "ACTIVE" || user.status === "DELETE"
          ? "text-red-600"
          : "text-green-600",
    },
    {
      icon: Power,
      label: "Login as User",
      onClick: () => onLogin && onLogin(user),
      color: "text-blue-600",
    },
    {
      icon: Trash2,
      label: "Delete User",
      onClick: () => onDelete(user),
      color: "text-red-700",
      isDanger: true,
    },
  ];

  // 🆕 Combine menu items based on user role
  const menuItems = isAdminUser
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  return (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
            item.isDanger ? "hover:bg-red-50" : ""
          }`}
        >
          <item.icon className={`w-4 h-4 mr-3 ${item.color}`} />
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ActionsMenu;
