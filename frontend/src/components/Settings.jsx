import { CreditCard, Settings as SettingsIcon, UserCog } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

import MainSettings from "../pages/MainSetting";
import CompanyAccounts from "../pages/CompanyAccounts";
import ManageServices from "../pages/ManageServices";
import RoleManager from "./RoleManager";
import PageHeader from "./ui/PageHeader";

const Settings = () => {
  const { currentUser = {} } = useSelector((state) => state.auth);
  const roleName = currentUser?.role?.name || "";

  // Define all tabs
  const allTabs = [
    {
      id: "general",
      label: "General Settings",
      icon: SettingsIcon,
      adminOnly: true,
    },
    {
      id: "accounts",
      label: "Company Accounts",
      icon: CreditCard,
      adminOnly: false,
    },
    { id: "services", label: "Services", icon: UserCog, adminOnly: true },
    { id: "role", label: "Roles Management", icon: UserCog, adminOnly: true },
    // { id: "address", label: "Address Management", icon: UserCog, adminOnly: true },
  ];

  const tabs =
    roleName === "ADMIN" ? allTabs : allTabs.filter((tab) => !tab.adminOnly);

  const defaultTab =
    roleName === "ADMIN" ? "general" : tabs[0]?.id || "accounts";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general":
        return roleName === "ADMIN" ? <MainSettings /> : <NoAccess />;
      case "accounts":
        return <CompanyAccounts />;
      case "services":
        return roleName === "ADMIN" ? <ManageServices /> : <NoAccess />;
      case "role":
        return roleName === "ADMIN" ? <RoleManager /> : <NoAccess />;
      // case "address":
      //   return <Address />;
      default:
        return roleName === "ADMIN" ? <MainSettings /> : <NoAccess />;
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb={["Dashboard", "Settings"]}
        title="Settings"
        description="Manage your application settings and configurations"
      />

      <div className="flex space-x-1 my-8 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">{renderActiveTab()}</div>
    </div>
  );
};

const NoAccess = () => (
  <div className="text-gray-500 p-6 bg-gray-50 rounded-md border border-gray-200">
    You don’t have permission to view this section.
  </div>
);

export default Settings;
