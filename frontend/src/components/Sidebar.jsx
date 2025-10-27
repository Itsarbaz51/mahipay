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
  History,
  BadgeIndianRupee,
  Wallet,
  LogInIcon,
  RedoDot,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Get current user from Redux store
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };
  const menuItems = [
    // --- MAIN ---
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      path: "/dashboard",
      permissions: [
        "ADMIN",
        "STATE HEAD",
        "MASTER DISTRIBUTOR",
        "DISTRIBUTOR",
        "RETAILER",
      ],
    },
    // {
    //   id: "add-fund",
    //   label: "Add Fund",
    //   icon: BadgeIndianRupee,
    //   path: "/add-fund",
    //   permissions: [
    //     "STATE HEAD",
    //     "MASTER DISTRIBUTOR",
    //     "DISTRIBUTOR",
    //     "RETAILER",
    //   ],
    // },
    {
      id: "members",
      label: "Members",
      icon: Users,
      path: "/members",
      permissions: ["ADMIN", "STATE HEAD", "MASTER DISTRIBUTOR", "DISTRIBUTOR"],
    },
    {
      id: "commission",
      label: "Commission",
      icon: Percent,
      path: "/commission",
      permissions: [
        "ADMIN",
        "STATE HEAD",
        "MASTER DISTRIBUTOR",
        "DISTRIBUTOR",
        "RETAILER",
      ],
    },
    {
      id: "Transactions",
      label: "Transactions",
      icon: History,
      path: "/transactions",
      permissions: [
        "ADMIN",
        "STATE HEAD",
        "MASTER DISTRIBUTOR",
        "DISTRIBUTOR",
        "RETAILER",
      ],
    },

    // --- SERVICE ---
    {
      id: "payout",
      label: "Payouts",
      icon: ArrowDownCircle,
      path: "/card-payout",
      permissions: [
        "STATE HEAD",
        "MASTER DISTRIBUTOR",
        "DISTRIBUTOR",
        "RETAILER",
      ],
    },

    // --- ADMIN ONLY ---
    {
      id: "kyc",
      label: "KYC Requests",
      icon: Shield,
      path: "/all-kyc",
      permissions: ["ADMIN"],
    },
    // {
    //   id: "employee-management",
    //   label: "Employee Management",
    //   icon: Users,
    //   path: "/employee-management",
    //   permissions: ["ADMIN"],
    // },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      path: "/reports",
      permissions: ["ADMIN"],
    },
    {
      id: "login-logs",
      label: "Login Logs",
      icon: LogInIcon,
      path: "/login-logs",
      permissions: ["ADMIN"],
    },
    // {
    //   id: "audit-logs",
    //   label: "Audit Logs",
    //   icon: RedoDot,
    //   path: "/audit-logs",
    //   permissions: ["ADMIN"],
    // },

    // --- SYSTEM ---
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      permissions: [
        "ADMIN",
        // "STATE HEAD",
        // "MASTER DISTRIBUTOR",
        // "DISTRIBUTOR",
        // "RETAILER",
      ],
    },
  ];

  // Safe data extraction with fallbacks
  const userData = currentUser || {};
  const role = userData.role?.name || userData.role || "USER";

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter((item) => {
    return item.permissions.includes(role);
  });

  // Group menu items by category for better organization
  const mainItems = filteredMenuItems.filter((item) =>
    ["dashboard", "add-fund", "members", "commission", "Transactions"].includes(
      item.id
    )
  );

  const serviceItems = filteredMenuItems.filter((item) =>
    ["payout"].includes(item.id)
  );

  const adminItems = filteredMenuItems.filter((item) =>
    [
      "kyc",
      "employee-management",
      "reports",
      "permission",
      "login-logs",
      "audit-logs",
    ].includes(item.id)
  );

  const roleSpecificItems = filteredMenuItems.filter((item) =>
    ["md-dashboard", "dist-dashboard", "retailer-dashboard"].includes(item.id)
  );

  const systemItems = filteredMenuItems.filter((item) =>
    ["settings"].includes(item.id)
  );

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

  // Get user details for display
  const firstName = userData.firstName || "";
  const lastName = userData.lastName || "";
  const username = userData.username || "";
  const profileImage = userData.profileImage || "";
  const walletBalance = userData.wallets?.[0]?.balance || 0;

  // Get initials for avatar
  const initials = firstName
    ? firstName[0].toUpperCase()
    : username
    ? username[0].toUpperCase()
    : "U";

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-64 flex flex-col fixed h-screen border-r border-gray-300 bg-white">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payment System</h2>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col fixed h-screen border-r border-gray-300 bg-white z-50">
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
            {profileImage ? (
              <img
                src={profileImage}
                alt={firstName || "User"}
                className="h-12 w-12 rounded-full object-contain border border-gray-300 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {initials}
              </div>
            )}

            <div className="ml-3 flex-1 min-w-0">
              <p className="font-medium text-sm truncate capitalize">
                {firstName && lastName
                  ? `${firstName} ${lastName}`.trim()
                  : firstName
                  ? firstName
                  : username || "User"}
              </p>
              <p className="text-xs capitalize text-gray-500 truncate">
                {username || "username"}
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
              ₹{(walletBalance / 100).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <MenuSection title="Main" items={mainItems} />

        {/* Role Specific Dashboard */}
        {roleSpecificItems.length > 0 && (
          <MenuSection title={`${role} Dashboard`} items={roleSpecificItems} />
        )}

        {/* Services Section */}
        {serviceItems.length > 0 && (
          <MenuSection title="Services" items={serviceItems} />
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <MenuSection title="Administration" items={adminItems} />
        )}

        {/* System Section */}
        {systemItems.length > 0 && (
          <MenuSection title="System" items={systemItems} />
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-300">
        <button
          onClick={handleLogout}
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
