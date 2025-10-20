import { CreditCard, Eye, SettingsIcon, UserCog } from "lucide-react";
import { useState } from "react";
import MainSettings from "../pages/MainSetting";
import LoginLogs from "../pages/LoginLogs";
import CompanyAccounts from "../pages/CompanyAccounts";
import ManageServices from "../pages/ManageServices";
import RoleManager from "./RoleManager";
import Address from "./tabels/Address";
import PageHeader from "./ui/PageHeader";


const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General Settings", icon: SettingsIcon },
    { id: "logs", label: "Login Logs", icon: Eye },
    { id: "accounts", label: "Company Accounts", icon: CreditCard },
    { id: "services", label: "Services", icon: UserCog },
    { id: "role", label: "Roles Management", icon: UserCog },
    { id: "address", label: "Address Management", icon: UserCog },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general":
        return <MainSettings />;
      case "logs":
        return <LoginLogs />;
      case "accounts":
        return <CompanyAccounts />;
      case "services":
        return <ManageServices />;
      case "role":
        return <RoleManager />;
      case "address":
        return <Address />;
      default:
        return <MainSettings />;
    }
  };

  return (
    <div className="">
      <PageHeader
        breadcrumb={["Dashboard", "Settings"]}
        title="Settings"
        description="Manage your application settings and configurations"
      />

      {/* Tabs */}
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

      {/* Render Active Tab Content */}
      {renderActiveTab()}
    </div>
  );
};

export default Settings;
