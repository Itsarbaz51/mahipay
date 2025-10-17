import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  ArrowDownCircle,
  Shield,
  Users,
  Percent,
  Settings,
  Play,
  LogOut,
  Wallet,
  BadgeIndianRupee,
} from "lucide-react";

const Sidebar = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    // --- MAIN ---
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      path: "/dashboard",
      group: "main",
    },
    {
      id: "add-fund",
      label: "Add Fund",
      icon: BadgeIndianRupee,
      path: "/add-fund",
      group: "main",
    },
    {
      id: "members",
      label: "Members",
      icon: Users,
      path: "/members",
      group: "main",
    },
    {
      id: "commission",
      label: "Commission",
      icon: Percent,
      path: "/commission",
      group: "main",
    },

    // --- SERVICE (non-admin) ---
    {
      id: "payout",
      label: "Payouts",
      icon: ArrowDownCircle,
      path: "/payout",
      group: "service",
    },

    // --- ADMIN ONLY ---
    {
      id: "kyc",
      label: "KYC Requests",
      icon: Shield,
      path: "/all-kyc",
      group: "admin",
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: Wallet,
      path: "/wallet",
      group: "admin",
    },
    {
      id: "employee-management",
      label: "Employee Management",
      icon: Users,
      path: "/employee-management",
      group: "admin",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      path: "/reports",
      group: "admin",
    },

    // --- SYSTEM ---
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      group: "system",
    },
  ];

  const user = currentUser?.user || {};
  const role = user.role?.name || "User";
  const isAdmin = role === "ADMIN";

  // Filter menus by role
  const mainItems = menuItems.filter((item) =>
    isAdmin
      ? item.group === "main" && item.id !== "add-fund"
      : item.group === "main"
  );
  const adminItems = isAdmin
    ? menuItems.filter((item) => item.group === "admin")
    : [];
  const systemItems = isAdmin
    ? menuItems.filter((item) => item.group === "system")
    : [];
  const serviceItems = !isAdmin
    ? menuItems.filter((item) => item.group === "service")
    : [];

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        className={`group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive ? "bg-gray-200 shadow-xs" : "hover:bg-gray-300"
        }`}
      >
        <Icon
          className={`h-5 w-5 mr-3 transition-transform duration-200 ${
            isActive ? "scale-110" : "group-hover:scale-105"
          }`}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const MenuSection = ({ title, items }) =>
    items.length > 0 && (
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-3">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    );

  // Get initials
  const initials = user.firstName
    ? user.firstName[0].toUpperCase()
    : user.name
    ? user.name[0].toUpperCase()
    : "U";

  return (
    <div className="w-64 flex flex-col fixed h-screen border-r border-gray-300 bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-300">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center">
            <Play className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Payment System</h2>
            <p className="text-xs text-gray-600">{role} Panel</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4">
        <div className="backdrop-blur-sm rounded-xl p-4 border text-black border-gray-300">
          <div className="flex items-center mb-3">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.firstName || "User"}
                className="h-12 w-12 rounded-full object-contain border border-gray-300 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {initials}
              </div>
            )}

            <div className="ml-3 flex-1 min-w-0">
              <p className="font-medium text-sm truncate capitalize">
                {user.firstName + " " + user.lastName || "User"}
              </p>
              <p className="text-xs capitalize text-gray-500 truncate">
                {user.username || "username"}
              </p>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-gray-100 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Wallet Balance</span>
              <Wallet className="h-3 w-3 text-gray-500" />
            </div>
            <p className="text-sm font-semibold mt-1 text-gray-800">
              ₹{Number(user.walletBalance || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <MenuSection title="Main" items={mainItems} />
        {isAdmin && <MenuSection title="Administration" items={adminItems} />}
        {isAdmin && <MenuSection title="System" items={systemItems} />}
        {!isAdmin && <MenuSection title="Services" items={serviceItems} />}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-300">
        <button
          onClick={onLogout}
          className="w-full cursor-pointer hover:bg-red-100 flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 mr-3 text-red-600 group-hover:scale-105 transition-transform duration-200" />
          <span className="font-medium text-red-600">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
