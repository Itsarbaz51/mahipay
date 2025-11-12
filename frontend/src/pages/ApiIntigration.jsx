import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  allServices,
  ApiTesting,
  envConfig,
  toggleStatusApiIntigration,
} from "../redux/slices/serviceSlice";
import { CheckCircle2 } from "lucide-react";
import IntegrationTable from "../components/tabels/IntegrationTable";
import IntegrationForm from "../components/forms/IntegrationForm";

function ApiIntegration() {
  const [integrations, setIntegrations] = useState([]);
  const [selectedApi, setSelectedApi] = useState(null);
  const [envInputs, setEnvInputs] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [testConnectionSuccess, setTestConnectionSuccess] = useState(false);

  const dispatch = useDispatch();
  const { serviceProviders } = useSelector((state) => state.services);

  useEffect(() => {
    dispatch(allServices("all"));
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(serviceProviders?.allApiIntigration)) {
      const sanitized = serviceProviders?.allApiIntigration.map((sp) => {
        let envConfigData = sp.envConfig || [];
        if (typeof sp.envConfig === "string") {
          try {
            envConfigData = JSON.parse(sp.envConfig);
          } catch {
            envConfigData = [];
          }
        }
        return {
          ...sp,
          envConfig: envConfigData,
          connected: sp.apiIntegrationStatus || false,
          envVars: envConfigData.map((env) => ({
            key: env.key || "",
            value: env.value || "",
            showValue: false,
          })),
        };
      });
      setIntegrations(sanitized);
    }
  }, [serviceProviders?.allApiIntigration]);

  const handleConnect = useCallback((api) => {
    setSelectedApi(api);
    const expectedCount = Number(api?.keyValueInputNumber) || 0;
    let initialEnvVars = [];

    if (Array.isArray(api.envConfig) && api.envConfig.length > 0) {
      initialEnvVars = api.envConfig.map((env) => ({
        key: env.key || "",
        value: env.value || "",
      }));
    } else if (expectedCount > 0) {
      initialEnvVars = Array.from({ length: expectedCount }, () => ({
        key: "",
        value: "",
      }));
    }

    setEnvInputs(initialEnvVars);

    const apiSubServices = api.subService || [];
    if (Array.isArray(apiSubServices) && apiSubServices.length > 0) {
      setSubServices(
        apiSubServices.map((sub) => ({
          id: sub.id,
          code: sub.code,
          name: sub.name,
          apiIntegrationStatus: sub.apiIntegrationStatus || false,
        }))
      );
    } else {
      setSubServices([]);
    }

    setShowPopup(true);
  }, []);

  const handleDisconnectBtn = useCallback(
    async (apiId) => {
      try {
        await dispatch(toggleStatusApiIntigration(apiId));
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    },
    [dispatch]
  );

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

  const handleSubServiceToggle = useCallback((subService, isChecked) => {
    setSubServices((prev) =>
      prev.map((sub) => {
        if (sub.id === subService.id) {
          return { ...sub, apiIntegrationStatus: isChecked };
        }
        return sub;
      })
    );
  }, []);

  // --- Test Connection ---
  const handleTestConnection = async () => {
    if (!selectedApi) return;

    setTestingConnection(true);
    setTestConnectionSuccess(false);
    try {
      const validEnvs = envInputs.filter(
        (env) => env.key.trim() && env.value.trim()
      );
      const payload = { envConfig: validEnvs };

      await dispatch(ApiTesting(selectedApi.id, payload));
      setTestConnectionSuccess(true);
      setShowSuccessToast(true);

      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      setTestConnectionSuccess(false);
      throw console.error("Failed call api testing connection", error);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    try {
      const validEnvs = envInputs.filter(
        (env) => env.key.trim() && env.value.trim()
      );

      const payload = {
        envConfig: validEnvs,
        subServices: subServices.map((sub) => ({
          id: sub.id,
          apiIntegrationStatus: sub.apiIntegrationStatus || false,
        })),
      };

      await dispatch(envConfig({ id: selectedApi.id, payload }));
      setTestConnectionSuccess(false);
      setShowPopup(false);
    } catch (err) {
      console.error("❌ Save failed:", err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-4xl font-bold text-gray-900">API Integrations</h1>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {serviceProviders.count}
              Active
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl">
          Connect and manage your service provider APIs securely.
        </p>
      </div>

      {/* Integration Table */}
      <IntegrationTable
        integrations={integrations}
        onConnect={handleConnect}
        onDisconnect={handleDisconnectBtn}
      />

      {/* Popup Form */}
      {showPopup && selectedApi && (
        <IntegrationForm
          selectedApi={selectedApi}
          envInputs={envInputs}
          subServices={subServices}
          testingConnection={testingConnection}
          onTestConnection={handleTestConnection}
          testConnectionSuccess={testConnectionSuccess}
          onClose={() => {
            setShowPopup(false);
            setTestConnectionSuccess(false);
          }}
          onSave={handleSave}
          onUpdateEnv={updateEnvVariable}
          onToggleVisibility={toggleShowValue}
          onSubServiceToggle={handleSubServiceToggle}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
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
      )}
    </div>
  );
}

export default ApiIntegration;
