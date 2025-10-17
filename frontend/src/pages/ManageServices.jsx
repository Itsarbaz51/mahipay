import { useState } from "react";

export default function ManageServices() {
  const [services, setServices] = useState({
    aeps: true,
    bbps: true,
    recharge: true,
    uti: true,
    payout: true,
    qTransfer: true,
    dmt: true,
  });

  const servicesList = [
    // {
    //   key: "aeps",
    //   label: "AEPS",
    //   description: "Aadhaar Enabled Payment System",
    // },
    // { key: "bbps", label: "BBPS", description: "Bharat Bill Payment System" },
    // {
    //   key: "recharge",
    //   label: "Recharge",
    //   description: "Mobile & DTH Recharge Services",
    // },
    // { key: "uti", label: "UTI", description: "UTI Pan Services" },
    { key: "payout", label: "Payout", description: "Money Transfer & Payout" },
    // {
    //   key: "qTransfer",
    //   label: "Q-Transfer",
    //   description: "Quick Transfer Services",
    // },
    // { key: "dmt", label: "DMT", description: "Domestic Money Transfer" },
  ];

  const toggleService = (serviceKey) => {
    setServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {servicesList.map((service) => (
        <div
          key={service.key}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            services[service.key]
              ? "bg-white border-blue-200 shadow-lg shadow-blue-100"
              : "bg-gray-50 border-red-200 shadow-sm"
          }`}
          onClick={() => toggleService(service.key)}
        >
          {/* Service Content */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {service.label}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-medium ${
                services[service.key] ? "text-blue-600" : "text-red-500"
              }`}
            >
              {services[service.key] ? "Active" : "Inactive"}
            </span>

            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                services[service.key] ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  services[service.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/5 group-hover:to-purple-400/5 transition-all duration-300" />
        </div>
      ))}
    </div>
  );
}
