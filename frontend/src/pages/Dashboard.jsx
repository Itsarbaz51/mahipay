import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  UserPlus,
  Percent,
  BarChart3,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Shield,
  Users,
  Download,
  Eye,
  Clock,
  Activity,
  CreditCard,
  PieChart,
  Zap,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  Settings,
  Lock,
  Unlock,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Enhanced dummy data with more realistic metrics
const DUMMY_DATA = {
  transactions: [
    {
      id: 1,
      userId: 1,
      type: "payin",
      amount: 500000,
      status: "success",
      commission: 2500,
      createdAt: new Date().toISOString(),
      method: "UPI",
      user: { firstName: "John", lastName: "Doe" },
      risk: "low",
      country: "IN",
    },
    {
      id: 2,
      userId: 2,
      type: "payout",
      amount: 300000,
      status: "success",
      commission: 1500,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      method: "Bank Transfer",
      user: { firstName: "Jane", lastName: "Smith" },
      risk: "low",
      country: "IN",
    },
    {
      id: 3,
      userId: 1,
      type: "payin",
      amount: 750000,
      status: "pending",
      commission: 3750,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      method: "Card",
      user: { firstName: "John", lastName: "Doe" },
      risk: "medium",
      country: "IN",
    },
    {
      id: 4,
      userId: 3,
      type: "payout",
      amount: 200000,
      status: "failed",
      commission: 0,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      method: "UPI",
      user: { firstName: "Bob", lastName: "Johnson" },
      risk: "high",
      country: "IN",
    },
    {
      id: 5,
      userId: 2,
      type: "payin",
      amount: 1200000,
      status: "success",
      commission: 6000,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      method: "UPI",
      user: { firstName: "Jane", lastName: "Smith" },
      risk: "low",
      country: "IN",
    },
  ],
  users: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "ADMIN",
      parentId: null,
      wallets: [{ balance: 1250000, currency: "INR" }],
      isActive: true,
      lastLogin: new Date().toISOString(),
      kycStatus: "verified",
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      role: "agent",
      parentId: 1,
      wallets: [{ balance: 500000, currency: "INR" }],
      isActive: true,
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      kycStatus: "verified",
    },
    {
      id: 3,
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob@example.com",
      role: "user",
      parentId: 2,
      wallets: [{ balance: 250000, currency: "INR" }],
      isActive: false,
      lastLogin: new Date(Date.now() - 86400000).toISOString(),
      kycStatus: "pending",
    },
  ],
  commissionSettings: [
    {
      id: 1,
      level: "admin",
      type: "percentage",
      value: 0.5,
      minAmount: 100000,
      maxAmount: 10000000,
    },
    {
      id: 2,
      level: "agent",
      type: "percentage",
      value: 0.3,
      minAmount: 100000,
      maxAmount: 5000000,
    },
  ],
  systemHealth: {
    uptime: 99.8,
    activeSessions: 142,
    pendingTransactions: 3,
    failedLastHour: 2,
    avgResponseTime: 245,
    peakLoad: 78,
  },
  fraudAlerts: [
    { id: 1, type: "multiple_failed", userId: 3, severity: "high" },
    { id: 2, type: "unusual_amount", userId: 1, severity: "medium" },
  ],
  settlementSchedule: {
    nextSettlement: new Date(Date.now() + 7200000).toISOString(),
    pendingAmount: 2450000,
  },
};

const Dashboard = ({
  transactions = DUMMY_DATA.transactions,
  users = DUMMY_DATA.users,
  systemHealth = DUMMY_DATA.systemHealth,
  fraudAlerts = DUMMY_DATA.fraudAlerts,
  settlementSchedule = DUMMY_DATA.settlementSchedule,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("today");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("volume");

  // Simulate current user (would come from Redux in real app)
  const currentUser = users[0];
  const userRole = currentUser.role?.name || currentUser.role || "ADMIN";
  const userName =
    `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
    "User";
  const walletBalance = currentUser.wallets?.[0]?.balance || 0;

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Enhanced stats calculation
  const getUserStats = useMemo(() => {
    const filterByTimeRange = (date) => {
      const now = new Date();
      switch (timeRange) {
        case "today":
          return new Date(date).toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return new Date(date) >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return new Date(date) >= monthAgo;
        default:
          return true;
      }
    };

    const userTransactions = transactions.filter((t) =>
      filterByTimeRange(t.createdAt)
    );

    const totalPayin = userTransactions
      .filter((t) => t.type === "payin" && t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPayout = userTransactions
      .filter((t) => t.type === "payout" && t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalCommission = userTransactions
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + (t.commission || 0), 0);

    const pendingAmount = userTransactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingTransactions = userTransactions.filter(
      (t) => t.status === "pending"
    ).length;

    const successRate =
      userTransactions.length > 0
        ? (userTransactions.filter((t) => t.status === "success").length /
            userTransactions.length) *
          100
        : 0;

    const failureRate =
      userTransactions.length > 0
        ? (userTransactions.filter((t) => t.status === "failed").length /
            userTransactions.length) *
          100
        : 0;

    const avgTransactionValue =
      userTransactions.length > 0
        ? userTransactions.reduce((sum, t) => sum + t.amount, 0) /
          userTransactions.length
        : 0;

    const highRiskTransactions = userTransactions.filter(
      (t) => t.risk === "high" || t.risk === "medium"
    ).length;

    return {
      totalPayin,
      totalPayout,
      totalCommission,
      pendingAmount,
      transactionCount: userTransactions.length,
      pendingTransactions,
      successRate,
      failureRate,
      avgTransactionValue,
      highRiskTransactions,
      netCashFlow: totalPayin - totalPayout,
    };
  }, [transactions, timeRange, refreshKey]);

  const stats = getUserStats;

  const formatCurrency = (amountInPaise) => {
    return `₹${(amountInPaise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCompactCurrency = (amountInPaise) => {
    const amount = amountInPaise / 100;
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return formatCurrency(amountInPaise);
  };

  // Enhanced stat cards with real-time trends
  const statCards = [
    {
      title: "Wallet Balance",
      value: formatCurrency(walletBalance),
      subText: "Available funds",
      icon: Wallet,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: "+5.2%",
      trendPositive: true,
    },
    {
      title: "Net Cash Flow",
      value: formatCompactCurrency(stats.netCashFlow),
      subText: "Payin - Payout",
      icon: Activity,
      iconBg: stats.netCashFlow >= 0 ? "bg-green-100" : "bg-red-100",
      iconColor: stats.netCashFlow >= 0 ? "text-green-600" : "text-red-600",
      trend: stats.netCashFlow >= 0 ? "+12.3%" : "-8.5%",
      trendPositive: stats.netCashFlow >= 0,
    },
    {
      title: "Commission Earned",
      value: formatCompactCurrency(stats.totalCommission),
      subText: "Total earnings",
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: "+15.1%",
      trendPositive: true,
    },
    {
      title: "Success Rate",
      value: `${stats.successRate.toFixed(1)}%`,
      subText: `${stats.transactionCount} transactions`,
      icon: CheckCircle,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+2.1%",
      trendPositive: true,
    },
  ];

  // Payment method distribution
  const paymentMethodStats = useMemo(() => {
    const methods = {};
    transactions.forEach((t) => {
      if (t.status === "success") {
        methods[t.method] = (methods[t.method] || 0) + 1;
      }
    });
    return Object.entries(methods).map(([method, count]) => ({
      method,
      count,
      percentage:
        (count / transactions.filter((t) => t.status === "success").length) *
        100,
    }));
  }, [transactions, refreshKey]);

  // Recent transactions
  const recentTransactions = transactions
    .slice(0, 5)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header with notifications */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userName}
            </h1>
            <p className="text-blue-100 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {userRole} Dashboard • System Uptime: {systemHealth.uptime}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              >
                <Bell className="h-5 w-5" />
                {fraudAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {fraudAlerts.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 text-gray-800 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {fraudAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Fraud Alert</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {alert.type.replace("_", " ")} detected for user #
                              {alert.userId}
                            </p>
                            <span
                              className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                                alert.severity === "high"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {alert.severity} priority
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="today" className="text-gray-800">
                Today
              </option>
              <option value="week" className="text-gray-800">
                This Week
              </option>
              <option value="month" className="text-gray-800">
                This Month
              </option>
              <option value="all" className="text-gray-800">
                All Time
              </option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {fraudAlerts.some((a) => a.severity === "high") && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800">
                High Priority Alert
              </h4>
              <p className="text-sm text-red-600">
                {fraudAlerts.filter((a) => a.severity === "high").length}{" "}
                high-risk transactions require immediate attention
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${
              isLoading ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">{card.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-xs text-gray-500">{card.subText}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {card.trendPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  card.trendPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {card.trend}
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Metrics and Settlement Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time System Metrics */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Real-time Metrics
            </h3>
            <button
              onClick={() => setExpandedMetrics(!expandedMetrics)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              {expandedMetrics ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {expandedMetrics ? "Collapse" : "Expand"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">
                {systemHealth.activeSessions}
              </p>
              <p className="text-xs text-blue-600">Active Sessions</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-700">
                {stats.pendingTransactions}
              </p>
              <p className="text-xs text-yellow-600">Pending</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {systemHealth.avgResponseTime}ms
              </p>
              <p className="text-xs text-green-600">Avg Response</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">
                {systemHealth.peakLoad}%
              </p>
              <p className="text-xs text-purple-600">Peak Load</p>
            </div>
          </div>

          {expandedMetrics && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    Transaction Success Rate
                  </span>
                  <span className="font-semibold text-gray-900">
                    {stats.successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.successRate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">System Load</span>
                  <span className="font-semibold text-gray-900">
                    {systemHealth.peakLoad}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      systemHealth.peakLoad > 80
                        ? "bg-red-500"
                        : systemHealth.peakLoad > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${systemHealth.peakLoad}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settlement Schedule */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5" />
            <h3 className="text-lg font-bold">Next Settlement</h3>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
            <p className="text-sm mb-1 text-indigo-100">Scheduled Time</p>
            <p className="text-2xl font-bold">
              {new Date(settlementSchedule.nextSettlement).toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>
            <p className="text-xs text-indigo-100 mt-1">
              {new Date(settlementSchedule.nextSettlement).toLocaleDateString(
                "en-IN"
              )}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm mb-1 text-indigo-100">Pending Amount</p>
            <p className="text-xl font-bold">
              {formatCurrency(settlementSchedule.pendingAmount)}
            </p>
            <button className="mt-3 w-full py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Payment Methods
            </h3>
          </div>
          <div className="space-y-3">
            {paymentMethodStats.map((method, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {method.method}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {method.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${method.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Recent Transactions
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === "payin"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {transaction.type === "payin" ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {transaction.user?.firstName} {transaction.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.method} •{" "}
                      {new Date(transaction.createdAt).toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-md border text-xs font-medium ${getRiskColor(
                      transaction.risk
                    )}`}
                  >
                    {transaction.risk} risk
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p
                    className={`font-semibold text-sm ${
                      transaction.type === "payin"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "payin" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Assessment */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Risk Assessment
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Configure
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800">
                  High Risk Transactions
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {stats.highRiskTransactions}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Requires immediate review
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">
                  Failed Transactions
                </span>
                <span className="text-2xl font-bold text-yellow-600">
                  {transactions.filter((t) => t.status === "failed").length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-yellow-600">
                <XCircle className="h-4 w-4" />
                {stats.failureRate.toFixed(1)}% failure rate
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">
                  Verified Transactions
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {
                    transactions.filter(
                      (t) => t.status === "success" && t.risk === "low"
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-4 w-4" />
                Low risk, processed successfully
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Analytics */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Transaction Analytics
            </h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="volume">Volume</option>
              <option value="value">Value</option>
              <option value="commission">Commission</option>
            </select>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.transactionCount}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  +18% vs last period
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Avg Transaction</p>
                <p className="text-lg font-bold text-purple-700">
                  {formatCompactCurrency(stats.avgTransactionValue)}
                </p>
                <p className="text-xs text-purple-500 mt-1">+5.2% increase</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Commission</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCompactCurrency(stats.totalCommission)}
                </p>
                <p className="text-xs text-green-500 mt-1">+12.4% growth</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Payin vs Payout Ratio</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalPayout > 0
                    ? (stats.totalPayin / stats.totalPayout).toFixed(2)
                    : "N/A"}
                  :1
                </span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="bg-green-500"
                  style={{
                    width: `${
                      (stats.totalPayin /
                        (stats.totalPayin + stats.totalPayout)) *
                      100
                    }%`,
                  }}
                  title={`Payin: ${formatCurrency(stats.totalPayin)}`}
                ></div>
                <div
                  className="bg-red-500"
                  style={{
                    width: `${
                      (stats.totalPayout /
                        (stats.totalPayin + stats.totalPayout)) *
                      100
                    }%`,
                  }}
                  title={`Payout: ${formatCurrency(stats.totalPayout)}`}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Payin: {formatCompactCurrency(stats.totalPayin)}</span>
                <span>Payout: {formatCompactCurrency(stats.totalPayout)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Pending Settlement
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.pendingAmount)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-3 flex items-center text-xs text-gray-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {stats.pendingTransactions} transactions awaiting processing
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
          <p className="text-sm text-gray-500">Streamline your workflow</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-blue-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700">Add User</span>
          </button>

          <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-green-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <ArrowUpCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-green-700">
              New Payin
            </span>
          </button>

          <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-red-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <ArrowDownCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-red-700">New Payout</span>
          </button>

          <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-purple-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Percent className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-purple-700">
              Commission
            </span>
          </button>

          <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-yellow-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Download className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-yellow-700">Export</span>
          </button>

          <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gray-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="text-sm">All Regions Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Secure Connection</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString("en-IN")} •
            Auto-refresh in 30s
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
