import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  ArrowUp,
  ArrowDown,
  PieChart,
  LineChart,
  Eye,
  Shield,
  CreditCard,
  Wallet,
} from "lucide-react";

// Enhanced analytics dashboard component
const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  // Generate comprehensive sample data for demonstration
  const generateSampleData = () => {
    const baseAmount = 5000000;
    const growthRate = 0.15;
    const currentDate = new Date();

    // Generate monthly labels for current year
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      months.push(date.toLocaleDateString("en-US", { month: "short" }));
    }

    return {
      overview: {
        totalRevenue: baseAmount * (1 + Math.random() * growthRate),
        totalTransactions: Math.floor(1250 + Math.random() * 500),
        activeUsers: Math.floor(450 + Math.random() * 150),
        successRate: 95 + Math.random() * 4,
        revenueGrowth: 12.5 + Math.random() * 10,
        userGrowth: 8.2 + Math.random() * 6,
        conversionRate: 3.2 + Math.random() * 2,
        avgOrderValue: 4200 + Math.random() * 1000,
      },
      revenueData: {
        labels: months,
        datasets: [
          {
            label: "Revenue",
            data: Array.from(
              { length: 12 },
              (_, i) =>
                baseAmount *
                (1 + (i * growthRate) / 12 + (Math.random() * 0.1 - 0.05))
            ),
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79, 70, 229, 0.1)",
          },
        ],
      },
      transactionMetrics: {
        success: 1245,
        failed: 23,
        pending: 12,
        refunded: 8,
        chargeback: 2,
      },
      userMetrics: {
        newUsers: 45,
        returningUsers: 385,
        churnedUsers: 12,
        activeSessions: 142,
        totalUsers: 1560,
        growthRate: 8.2,
      },
      performance: {
        avgResponseTime: 245,
        uptime: 99.8,
        peakLoad: 78,
        errorRate: 0.2,
        serverHealth: 95.5,
      },
      realTime: {
        liveTransactions: 23,
        queueLength: 5,
        activeFraudChecks: 3,
        systemAlerts: 1,
      },
    };
  };

  // Simulate API call with proper error handling
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, we'll use sample data directly
      // In production, replace this with actual API call:
      /*
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': 'Bearer your-token-here',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response");
      }

      const data = await response.json();
      setAnalyticsData(data);
      */

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use sample data for demonstration
      const data = generateSampleData();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);

      // Fallback to sample data
      const fallbackData = generateSampleData();
      setAnalyticsData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, refreshKey]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = () => {
    if (analyticsData) {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${timeRange}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactNumber = (num) => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(1) + "Cr";
    }
    if (num >= 100000) {
      return (num / 100000).toFixed(1) + "L";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Main KPI Cards
  const kpiCards = [
    {
      title: "Total Revenue",
      value: analyticsData
        ? formatCurrency(analyticsData.overview.totalRevenue)
        : "₹0",
      change: analyticsData
        ? `${analyticsData.overview.revenueGrowth.toFixed(1)}%`
        : "0%",
      isPositive: true,
      icon: DollarSign,
      color: "emerald",
      description: "Total processed amount",
    },
    {
      title: "Total Transactions",
      value: analyticsData
        ? formatCompactNumber(analyticsData.overview.totalTransactions)
        : "0",
      change: "+8.2%",
      isPositive: true,
      icon: CreditCard,
      color: "blue",
      description: "Successful transactions",
    },
    {
      title: "Active Users",
      value: analyticsData
        ? formatCompactNumber(analyticsData.overview.activeUsers)
        : "0",
      change: analyticsData
        ? `${analyticsData.overview.userGrowth.toFixed(1)}%`
        : "0%",
      isPositive: true,
      icon: Users,
      color: "purple",
      description: "Currently active users",
    },
    {
      title: "Success Rate",
      value: analyticsData
        ? `${analyticsData.overview.successRate.toFixed(1)}%`
        : "0%",
      change: "+2.1%",
      isPositive: true,
      icon: Activity,
      color: "green",
      description: "Transaction success rate",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      emerald: {
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-500",
        text: "text-emerald-700",
        change: "text-emerald-600",
      },
      blue: {
        bg: "bg-blue-50",
        iconBg: "bg-blue-500",
        text: "text-blue-700",
        change: "text-blue-600",
      },
      purple: {
        bg: "bg-purple-50",
        iconBg: "bg-purple-500",
        text: "text-purple-700",
        change: "text-purple-600",
      },
      green: {
        bg: "bg-green-50",
        iconBg: "bg-green-500",
        text: "text-green-700",
        change: "text-green-600",
      },
    };
    return colors[color] || colors.emerald;
  };

  // Real-time metrics for the performance section
  const realTimeMetrics = analyticsData?.realTime
    ? [
        {
          label: "Live Transactions",
          value: analyticsData.realTime.liveTransactions,
          color: "bg-blue-500",
          icon: Activity,
        },
        {
          label: "Queue Length",
          value: analyticsData.realTime.queueLength,
          color: "bg-yellow-500",
          icon: BarChart3,
        },
        {
          label: "Fraud Checks",
          value: analyticsData.realTime.activeFraudChecks,
          color: "bg-red-500",
          icon: Shield,
        },
        {
          label: "System Alerts",
          value: analyticsData.realTime.systemAlerts,
          color:
            analyticsData.realTime.systemAlerts > 0
              ? "bg-red-500"
              : "bg-green-500",
          icon: analyticsData.realTime.systemAlerts > 0 ? Eye : CheckCircle,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time insights and performance metrics • Using sample data
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!analyticsData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, index) => {
          const color = getColorClasses(card.color);
          return (
            <div
              key={index}
              className={`${
                color.bg
              } rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                isLoading ? "animate-pulse" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color.iconBg} shadow-md`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  {card.isPositive ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${color.change}`}>
                    {card.change}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {isLoading ? "..." : card.value}
              </h3>
              <p className="text-gray-600 text-sm mb-2">{card.title}</p>
              <p className="text-gray-500 text-xs">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Revenue Trend
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Revenue
              </div>
            </div>
          </div>
          <div className="h-80">
            {analyticsData ? (
              <div className="w-full h-full flex items-end justify-between gap-1 px-2">
                {analyticsData.revenueData.datasets[0].data.map(
                  (value, index) => {
                    const maxValue = Math.max(
                      ...analyticsData.revenueData.datasets[0].data
                    );
                    const height = Math.max((value / maxValue) * 100, 5); // Minimum height of 5%
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1 group"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-500 hover:from-blue-400 hover:to-blue-500 group-hover:shadow-lg relative"
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(value)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-2 font-medium">
                          {analyticsData.revenueData.labels[index]}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              System Performance
            </h3>
          </div>
          <div className="space-y-6">
            {analyticsData &&
              [
                {
                  label: "Uptime",
                  value: `${analyticsData.performance.uptime}%`,
                  color: "bg-green-500",
                  width: analyticsData.performance.uptime,
                },
                {
                  label: "Success Rate",
                  value: `${analyticsData.overview.successRate.toFixed(1)}%`,
                  color: "bg-blue-500",
                  width: analyticsData.overview.successRate,
                },
                {
                  label: "System Load",
                  value: `${analyticsData.performance.peakLoad}%`,
                  color:
                    analyticsData.performance.peakLoad > 80
                      ? "bg-red-500"
                      : analyticsData.performance.peakLoad > 60
                      ? "bg-yellow-500"
                      : "bg-green-500",
                  width: analyticsData.performance.peakLoad,
                },
                {
                  label: "Error Rate",
                  value: `${analyticsData.performance.errorRate}%`,
                  color: "bg-gray-500",
                  width: analyticsData.performance.errorRate * 10,
                },
              ].map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">
                      {metric.label}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {metric.value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${metric.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${metric.width}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real-time Metrics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-600" />
            Real-time Metrics
          </h3>
          {analyticsData && (
            <div className="space-y-4">
              {realTimeMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${metric.color} bg-opacity-10`}
                    >
                      <metric.icon
                        className={`h-4 w-4 ${metric.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {metric.label}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Metrics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            User Analytics
          </h3>
          {analyticsData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">New Users</span>
                <span className="font-semibold text-green-600 text-lg">
                  +{analyticsData.userMetrics.newUsers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Returning Users
                </span>
                <span className="font-semibold text-blue-600 text-lg">
                  {analyticsData.userMetrics.returningUsers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Active Sessions
                </span>
                <span className="font-semibold text-purple-600 text-lg">
                  {analyticsData.userMetrics.activeSessions}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Quick Stats
          </h3>
          {analyticsData && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(
                    analyticsData.overview.totalTransactions
                  )}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Total Transactions
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.performance.avgResponseTime}ms
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Avg Response Time
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.overview.activeUsers}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Active Users
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl flex items-center gap-3 shadow-xl">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-900 font-medium">
              Loading analytics data...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
