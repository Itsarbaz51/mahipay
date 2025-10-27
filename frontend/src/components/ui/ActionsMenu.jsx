import {
  Edit,
  Key,
  CreditCard,
  User,
  Settings,
  LogIn,
  Power,
  Shield,
} from "lucide-react";

const ActionsMenu = ({
  user,
  onView,
  onEditProfile,
  onEdit,
  onEditPassword,
  onEditPin,
  // onSettings,
  // onLoginAs,
  onToggleStatus,
  onClose,
  onPermission,
}) => {
  const menuItems = [
    {
      icon: User,
      label: "View Profile",
      onClick: () => onView(user),
      color: "text-blue-600",
    },

    {
      icon: User,
      label: "Edit Profile Image",
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
    // {
    //   icon: Settings,
    //   label: "Settings",
    //   onClick: () => onSettings(user),
    //   color: "text-gray-600",
    // },
    // {
    //   icon: LogIn,
    //   label: "Login As User",
    //   onClick: () => onLoginAs(user),
    //   color: "text-indigo-600",
    // },
    {
      icon: Power,
      label: user.status === "ACTIVE" ? "Deactivate" : "Activate",
      onClick: () => onToggleStatus(user),
      color: user.status === "ACTIVE" ? "text-red-600" : "text-green-600",
    },
  ];

  return (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <item.icon className={`w-4 h-4 mr-3 ${item.color}`} />
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ActionsMenu;
