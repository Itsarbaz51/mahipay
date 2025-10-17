import { useState } from "react";
import {
  Search,
  Filter,
  MapPin,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  Globe,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Building2,
  CreditCard,
  Eye,
  MoreVertical,
  CheckCircle,
  UserCog,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import ManageServices from "../pages/ManageServices.jsx";
import RoleManager from "./RoleManager.jsx";
import Address from "./tabels/Address.jsx";
// import LoginLogsTable from "./tabels/LoginLogsTable.jsx";

// Sample data for login logs
const loginLogsData = [
  {
    id: 1,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.9418496",
    log: "75.7497856",
    timestamp: "2024-01-15 10:30:00",
    location: "Jaipur, India",
  },
  {
    id: 2,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-15 09:15:00",
    location: "Jaipur, India",
  },
  {
    id: 3,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-14 16:45:00",
    location: "Jaipur, India",
  },
  {
    id: 4,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-14 14:20:00",
    location: "Jaipur, India",
  },
  {
    id: 5,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-13 11:30:00",
    location: "Jaipur, India",
  },
];

const settingsData = [
  {
    key: "name",
    label: "Name",
    type: "text",
    icon: SettingsIcon,
    category: "company",
  },
  {
    key: "logo",
    label: "Company Logo",
    type: "text",
    icon: Building2,
    category: "company",
  },
  {
    key: "favicon",
    label: "Favicon",
    type: "text",
    icon: SettingsIcon,
    category: "company",
  },

  {
    key: "phone",
    label: "Phone Number",
    type: "text",
    icon: Phone,
    category: "contact",
  },
  {
    key: "email",
    label: "Email Address",
    type: "email",
    icon: Mail,
    category: "contact",
  },
  {
    key: "facebook",
    label: "Facebook URL",
    type: "url",
    icon: Facebook,
    category: "social",
  },
  {
    key: "twitter",
    label: "Twitter URL",
    type: "url",
    icon: Twitter,
    category: "social",
  },
  {
    key: "instagram",
    label: "Instagram URL",
    type: "url",
    icon: Instagram,
    category: "social",
  },
  {
    key: "website",
    label: "Website URL",
    type: "url",
    icon: Globe,
    category: "social",
  },
  {
    key: "linkedin",
    label: "LinkedIn URL",
    type: "url",
    icon: Linkedin,
    category: "social",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Number",
    type: "text",
    icon: MessageCircle,
    category: "contact",
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Settings form state
  const [formData, setFormData] = useState(
    Object.fromEntries(settingsData.map(({ key }) => [key, ""]))
  );
  const [editingField, setEditingField] = useState(null);
  const [savedFields, setSavedFields] = useState(new Set());

  // Company accounts state
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      holderName: "AZU",
      accountNumber: "34621114254",
      ifsc: "SBIN0004655",
      bankName: "State Bank of India",
    },
  ]);
  const [accountForm, setAccountForm] = useState({
    holderName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const itemsPerPage = 10;
  const filteredLogs = loginLogsData.filter(
    (log) =>
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSettingsChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSavedFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const handleSave = (key) => {
    setSavedFields((prev) => new Set([...prev, key]));
    setEditingField(null);
    setTimeout(() => {
      setSavedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 2000);
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAccount = () => {
    if (
      !accountForm.holderName ||
      !accountForm.accountNumber ||
      !accountForm.ifsc ||
      !accountForm.bankName
    )
      return;

    const newAccount = {
      id: Date.now(),
      ...accountForm,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setAccountForm({
      holderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    });
    setShowAccountForm(false);
  };

  const handleEditAccount = (id) => {
    const acc = accounts.find((acc) => acc.id === id);
    if (acc) {
      setAccountForm({
        holderName: acc.holderName,
        accountNumber: acc.accountNumber,
        ifsc: acc.ifsc,
        bankName: acc.bankName,
      });
      setEditingAccountId(id);
      setShowAccountForm(true);
    }
  };

  const handleUpdateAccount = () => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === editingAccountId ? { ...acc, ...accountForm } : acc
      )
    );
    setEditingAccountId(null);
    setAccountForm({
      holderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    });
    setShowAccountForm(false);
  };

  const handleDeleteAccount = (id) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getSettingsByCategory = (category) => {
    return settingsData.filter((setting) => setting.category === category);
  };

  const tabs = [
    { id: "general", label: "General Settings", icon: SettingsIcon },
    { id: "logs", label: "Login Logs", icon: Eye },
    { id: "accounts", label: "Company Accounts", icon: CreditCard },
    { id: "services", label: "services", icon: UserCog },
    { id: "role", label: "Roles Management", icon: UserCog },
    { id: "address", label: "Address Management", icon: UserCog },
  ];

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

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className="space-y-8">
          {/* Company Settings */}
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Company Information
            </h2>
            <div className="space-y-6 overflow-auto">
              {getSettingsByCategory("company").map(
                ({ key, label, type, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center flex-1">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {label}
                        </label>
                        {editingField === key ? (
                          type === "textarea" ? (
                            <textarea
                              value={formData[key]}
                              onChange={(e) =>
                                handleSettingsChange(key, e.target.value)
                              }
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                            />
                          ) : (
                            <input
                              type={type}
                              value={formData[key]}
                              onChange={(e) =>
                                handleSettingsChange(key, e.target.value)
                              }
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )
                        ) : (
                          <div className="text-sm text-gray-900">
                            {formData[key] || (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {savedFields.has(key) && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {editingField === key ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(key)}
                            className="p-2 text-green-600 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingField(key)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Contact Information
            </h2>
            <div className="space-y-6">
              {getSettingsByCategory("contact").map(
                ({ key, label, type, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center flex-1">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {label}
                        </label>
                        {editingField === key ? (
                          <input
                            type={type}
                            value={formData[key]}
                            onChange={(e) =>
                              handleSettingsChange(key, e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {formData[key] || (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {savedFields.has(key) && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {editingField === key ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(key)}
                            className="p-2 text-green-600 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingField(key)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Social Media Settings */}
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Social Media Links
            </h2>
            <div className="space-y-6">
              {getSettingsByCategory("social").map(
                ({ key, label, type, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center flex-1">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {label}
                        </label>
                        {editingField === key ? (
                          <input
                            type={type}
                            value={formData[key]}
                            onChange={(e) =>
                              handleSettingsChange(key, e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {formData[key] || (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {savedFields.has(key) && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {editingField === key ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(key)}
                            className="p-2 text-green-600 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingField(key)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
          <div className="p-6 border-b border-gray-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Login Activity Logs
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Monitor user login activities and locations
                </p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP ADDRESS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOCATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TIMESTAMP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(log.username)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {log.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: #{log.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {log.ip}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.lat}, {log.log}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <MapPin className="h-4 w-4 mr-1" />
                        View Location
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of{" "}
              {filteredLogs.length} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === idx + 1
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Accounts Tab */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Company Bank Accounts
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your company's banking information
                </p>
              </div>
              <button
                onClick={() => setShowAccountForm(!showAccountForm)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </button>
            </div>

            {/* Account Form */}
            {showAccountForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAccountId ? "Edit Account" : "Add New Account"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      name="holderName"
                      value={accountForm.holderName}
                      onChange={handleAccountChange}
                      placeholder="Enter account holder name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      name="accountNumber"
                      value={accountForm.accountNumber}
                      onChange={handleAccountChange}
                      placeholder="Enter account number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      name="ifsc"
                      value={accountForm.ifsc}
                      onChange={handleAccountChange}
                      placeholder="Enter IFSC code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      name="bankName"
                      value={accountForm.bankName}
                      onChange={handleAccountChange}
                      placeholder="Enter bank name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={
                      editingAccountId ? handleUpdateAccount : handleAddAccount
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingAccountId ? "Update Account" : "Add Account"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountForm(false);
                      setEditingAccountId(null);
                      setAccountForm({
                        holderName: "",
                        accountNumber: "",
                        ifsc: "",
                        bankName: "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Accounts Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACCOUNT HOLDER
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACCOUNT NUMBER
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IFSC CODE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BANK NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(account.holderName)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {account.holderName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Account Holder
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {account.accountNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                          {account.ifsc}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {account.bankName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAccount(account.id)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-400 text-lg mb-2">
                          No accounts found
                        </div>
                        <div className="text-gray-500 text-sm">
                          Add your first company account to get started
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === "services" && <ManageServices />}
      {activeTab === "role" && <RoleManager />}
      {activeTab === "address" && <Address />}
    </div>
  );
};

export default Settings;
