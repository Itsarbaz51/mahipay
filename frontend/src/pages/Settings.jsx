import {
  Cpu,
  CreditCard,
  Settings as SettingsIcon,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

import MainSettings from "./MainSetting";
import CompanyAccounts from "./CompanyAccounts";
import ManageServices from "./ManageServices";
import RoleManager from "../components/RoleManager";
import PageHeader from "../components/ui/PageHeader";
import ApiIntegration from "./ApiIntigration";

const Settings = () => {
  const { currentUser = {} } = useSelector((state) => state.auth);
  const currentUserRole = currentUser?.role || "";

  // Define all tabs
  const allTabs = [
    {
      id: "general",
      label: "General Settings",
      icon: SettingsIcon,
      adminOnly: true,
      employee: true,
    },
    {
      id: "accounts",
      label: "Company Accounts",
      icon: CreditCard,
      adminOnly: false,
      employee: false,
    },
    {
      id: "services",
      label: "Services",
      icon: UserCog,
      adminOnly: true,
      employee: true,
    },
    {
      id: "role",
      label: "Roles Management",
      icon: UserCog,
      adminOnly: true,
      employee: true,
    },
    {
      id: "api-intigration",
      label: "API Intigration",
      icon: Cpu,
      adminOnly: true,
      employee: true,
    },
  ];

  const tabs =
    currentUserRole.name === "ADMIN" || currentUserRole.type == "employee"
      ? allTabs
      : allTabs.filter((tab) => !tab.adminOnly);

  const defaultTab =
    currentUserRole.name === "ADMIN" || currentUserRole.type == "employee"
      ? "general"
      : tabs[0]?.id || "accounts";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general":
        return currentUserRole.name === "ADMIN" ||
          currentUserRole.type == "employee" ? (
          <MainSettings />
        ) : (
          <NoAccess />
        );
      case "accounts":
        return <CompanyAccounts />;
      case "services":
        return currentUserRole.name === "ADMIN" ||
          currentUserRole.type == "employee" ? (
          <ManageServices />
        ) : (
          <NoAccess />
        );
      case "role":
        return currentUserRole.name === "ADMIN" ||
          currentUserRole.type == "employee" ? (
          <RoleManager />
        ) : (
          <NoAccess />
        );
      case "api-intigration":
        return currentUserRole.name === "ADMIN" ||
          currentUserRole.type == "employee" ? (
          <ApiIntegration />
        ) : (
          <NoAccess />
        );
      default:
        return currentUserRole.name === "ADMIN" ||
          currentUserRole.type == "employee" ? (
          <MainSettings />
        ) : (
          <NoAccess />
        );
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
