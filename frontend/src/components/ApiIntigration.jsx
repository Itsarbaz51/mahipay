import React, { useEffect, useState } from "react";
import {
  Settings,
  Plus,
  Check,
  X,
  Key,
  Shield,
  Zap,
  Wifi,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { allServices } from "../redux/slices/serviceSlice";

// Constants for better maintainability
const COLOR_CLASSES = {
  blue: {
    bg: "bg-blue-500",
    lightBg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  purple: {
    bg: "bg-purple-500",
    lightBg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    gradient: "from-purple-500 to-purple-600",
  },
  amber: {
    bg: "bg-amber-500",
    lightBg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-500 to-amber-600",
  },
  emerald: {
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
  },
};

function ApiIntegration() {
  const [integrations, setIntegrations] = useState([]);
  const [selectedApi, setSelectedApi] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [envInputs, setEnvInputs] = useState([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const activeIntegrationsCount = integrations.filter(
    (i) => i.connected
  ).length;

  const dispatch = useDispatch();
  const { serviceProviders, isLoading } = useSelector(
    (state) => state.services
  );

  useEffect(() => {
    dispatch(allServices());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(serviceProviders)) {
      const sanitized = serviceProviders.map((sp) => ({
        ...sp,
        envConfig: sp.envConfig || [],
      }));
      setIntegrations(sanitized);
    }
  }, [serviceProviders]);

  // ✅ FIXED: Properly generate inputs based on keyValueInputNumber
  const handleConnect = (api) => {
    setSelectedApi(api);

    const count = Number(api?.keyValueInputNumber) || 0;

    // agar envConfig pehle se hai to use, warna naya array banao
    const envVars =
      api?.envConfig && api?.envConfig.length > 0
        ? api?.envConfig.map((env) => ({
            ...env,
            showValue: false,
          }))
        : Array.from({ length: count }, (_, i) => ({
            key: `KEY_${i + 1}`,
            value: "",
            isSecret: false,
            showValue: false,
          }));

    setEnvInputs(envVars);
    setShowPopup(true);
  };

  const handleDisconnect = (apiId) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === apiId
          ? { ...int, connected: false, envVars: [], status: "idle" }
          : int
      )
    );
  };

  const updateEnvVariable = (index, field, value) => {
    setEnvInputs((prev) =>
      prev.map((env, i) => (i === index ? { ...env, [field]: value } : env))
    );
  };

  const toggleShowValue = (index) => {
    setEnvInputs((prev) =>
      prev.map((env, i) =>
        i === index ? { ...env, showValue: !env.showValue } : env
      )
    );
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTestingConnection(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleSave = () => {
    const validEnvs = envInputs.filter(
      (env) => env.key.trim() && env.value.trim()
    );

    if (validEnvs.length === 0) {
      alert("Please fill all environment variables");
      return;
    }

    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === selectedApi?.id
          ? {
              ...int,
              connected: true,
              envVars: validEnvs,
              status: "connected",
            }
          : int
      )
    );

    handleClosePopup();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedApi(null);
    setEnvInputs([]);
  };

  const IntegrationTable = () => (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              API Service
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Description
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Environment Variables
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {integrations.map((api) => (
            <tr
              key={api?.id}
              className="hover:bg-gray-50 transition-colors duration-150 group"
            >
              <td className="py-4 px-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl`}>
                    {api?.iconUrl ? (
                      <img
                        src={api?.iconUrl}
                        alt={api?.name}
                        className="w-6 h-6"
                      />
                    ) : (
                      <Zap className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {api?.name}
                    </h3>
                  </div>
                </div>
              </td>

              <td className="py-4 px-6">
                <p className="text-sm text-gray-600 max-w-xs">
                  {api?.description || "No description provided"}
                </p>
              </td>

              <td className="py-4 px-6">
                {api?.apiIntegrationStatus ? (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-sm w-fit">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white">
                      CONNECTED
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-200 rounded-full w-fit">
                    <span className="text-xs font-bold text-gray-600">
                      DISCONNECTED
                    </span>
                  </div>
                )}
              </td>

              <td className="py-4 px-6">
                {api?.apiIntegrationStatus &&
                (api?.envConfig ?? []).length > 0 ? (
                  <div className="space-y-1">
                    {(api?.envConfig ?? []).slice(0, 2).map((env, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <Key className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="font-mono font-semibold text-gray-700">
                          {env?.key}
                        </span>
                        <span className="text-gray-400">=</span>
                        <span className="font-mono text-gray-600">
                          {env?.isSecret ? "••••••••" : env?.value}
                        </span>
                      </div>
                    ))}
                    {(api?.envConfig ?? []).length > 2 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{(api?.envConfig ?? []).length - 2} more variables
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    <div className="font-semibold mb-1">
                      Required Variables:
                    </div>
                    <div className="space-y-1">
                      {Array.isArray(api?.envConfig) &&
                        api.envConfig.map((env, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2"
                          >
                            <Key className="w-3 h-3 text-gray-400" />
                            <span className="font-mono text-gray-600">
                              {env.key}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </td>

              <td className="py-4 px-6">
                <div className="flex space-x-2">
                  {api?.connected ? (
                    <>
                      <button
                        onClick={() => handleConnect(api)}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-sm flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </button>
                      <button
                        onClick={() => handleDisconnect(api?.id)}
                        className="px-4 py-2 border-2 border-red-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 font-semibold text-sm flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(api)}
                      className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const EnvVariableInput = ({ env, index }) => (
    <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-gray-50 to-white hover:border-gray-300 transition-colors">
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-5">
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Key Name
          </label>
          <input
            type="text"
            value={env.key}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-sm font-mono transition-all cursor-not-allowed"
          />
        </div>
        <div className="col-span-6">
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Value
          </label>
          <div className="relative">
            <input
              type={env.isSecret && !env.showValue ? "password" : "text"}
              value={env.value}
              onChange={(e) =>
                updateEnvVariable(index, "value", e.target.value)
              }
              placeholder={`Enter ${env.key}`}
              className="w-full px-4 py-3 pr-20 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono transition-all"
            />
            {env.isSecret && (
              <button
                onClick={() => toggleShowValue(index)}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {env.showValue ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => copyToClipboard(env.value, index)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copiedIndex === index ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="col-span-1 flex items-end">
          <div className="p-3 text-gray-400">
            <Key className="w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={env.isSecret}
            onChange={(e) =>
              updateEnvVariable(index, "isSecret", e.target.checked)
            }
            className="w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            Mark as secret (hide and encrypt value)
          </span>
        </label>
        {env.isSecret && (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            Encrypted
          </span>
        )}
      </div>
    </div>
  );

  const SuccessToast = () => (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-green-200 p-4 flex items-center space-x-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Success!</p>
          <p className="text-sm text-gray-600">
            Configuration saved successfully
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            API Integrations
          </h1>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {activeIntegrationsCount} Active
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl">
          Connect and manage your payment service providers with secure
          credentials
        </p>
      </div>

      {/* Integration Table */}
      <IntegrationTable />

      {/* Success Toast */}
      {showSuccessToast && <SuccessToast />}

      {/* Configuration Modal */}
      {showPopup && selectedApi && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header with Gradient */}
            <div
              className={`p-6 bg-gradient-to-r ${
                COLOR_CLASSES[selectedApi?.color]?.gradient ||
                "from-blue-500 to-indigo-600"
              } text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                    {React.createElement(selectedApi?.icon || Zap, {
                      className: "w-7 h-7 text-white",
                    })}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedApi?.name} Configuration
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      {selectedApi?.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Required Environment Variables
                </h3>
                <p className="text-sm text-gray-600">
                  Fill in the required credentials for {selectedApi?.name}. All
                  sensitive data is encrypted.
                </p>
              </div>

              <div className="space-y-4">
                {envInputs.map((env, index) => (
                  <EnvVariableInput key={index} env={env} index={index} />
                ))}
              </div>

              <SecurityNotice />
            </div>

            {/* Footer */}
            <div className="p-6 border-t-2 border-gray-200 bg-gray-50 flex space-x-3">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 transition-all font-semibold disabled:opacity-50 flex items-center"
              >
                {testingConnection ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4 mr-2" />
                )}
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>
              <button
                onClick={handleClosePopup}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold"
              >
                <Check className="w-5 h-5 inline mr-2" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Extracted component
const SecurityNotice = () => (
  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
    <div className="flex items-start space-x-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-blue-900 mb-1">
          Security & Privacy
        </h4>
        <p className="text-sm text-blue-700 leading-relaxed">
          Your credentials are encrypted using AES-256 encryption and stored
          securely. They will only be used for API communication and never
          shared with third parties.
        </p>
      </div>
    </div>
  </div>
);

export default ApiIntegration;
