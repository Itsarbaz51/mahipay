import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import HeaderSection from "../components/ui/HeaderSection";
import StateCard from "../components/ui/StateCard";
import { useSelector } from "react-redux";

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
    },
  ],
  users: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "admin",
      parentId: null,
      wallets: [{ balance: 1250000, currency: "INR" }],
      isActive: true,
      lastLogin: new Date().toISOString(),
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
  },
};

const Dashboard = ({
  transactions = DUMMY_DATA.transactions,
  users = DUMMY_DATA.users,
  commissionSettings = DUMMY_DATA.commissionSettings,
  systemHealth = DUMMY_DATA.systemHealth,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("today");
  const [refreshKey, setRefreshKey] = useState(0);

  // Get current user from Redux store
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  // Refresh handler
  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Safe data extraction with fallbacks
  const userData = currentUser || users[0];
  const userRole = userData.role?.name || userData.role || "user";
  const userName =
    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";
  const walletBalance = userData.wallets?.[0]?.balance || 0;

  // Enhanced stats calculation with time filtering
  const getUserStats = useMemo(() => {
    const effectiveUser = currentUser || userData;

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

    const userTransactions = transactions
      .filter((t) => {
        if (userRole === "SUPER ADMIN" || userRole === "super_admin")
          return true;
        if (userRole === "ADMIN" || userRole === "admin") {
          const agentIds = users
            .filter((u) => u.parentId === effectiveUser.id)
            .map((u) => u.id);
          return agentIds.includes(t.userId) || t.userId === effectiveUser.id;
        }
        return t.userId === effectiveUser.id;
      })
      .filter((t) => filterByTimeRange(t.createdAt));

    const totalPayin = userTransactions
      .filter((t) => t.type === "payin" && t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPayout = userTransactions
      .filter((t) => t.type === "payout" && t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalCommission = userTransactions
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + (t.commission || 0), 0);

    const pendingTransactions = userTransactions.filter(
      (t) => t.status === "pending"
    ).length;

    const successRate =
      userTransactions.length > 0
        ? (userTransactions.filter((t) => t.status === "success").length /
            userTransactions.length) *
          100
        : 0;

    return {
      totalPayin,
      totalPayout,
      totalCommission,
      transactionCount: userTransactions.length,
      pendingTransactions,
      successRate,
    };
  }, [
    transactions,
    users,
    currentUser,
    userData,
    userRole,
    timeRange,
    refreshKey,
  ]);

  const stats = getUserStats;

  const formatCurrency = (amountInPaise) => {
    return `₹${(amountInPaise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCompactCurrency = (amountInPaise) => {
    const amount = amountInPaise / 100;
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amountInPaise);
  };

  // Enhanced stat cards with trends
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
      title: "Total Payin",
      value: formatCompactCurrency(stats.totalPayin),
      subText: "Money received",
      icon: ArrowUpCircle,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+12.3%",
      trendPositive: true,
    },
    {
      title: "Total Payout",
      value: formatCompactCurrency(stats.totalPayout),
      subText: "Money sent",
      icon: ArrowDownCircle,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      trend: "+8.7%",
      trendPositive: true,
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
  ];

  // Get managed users count
  const getManagedUsersStats = () => {
    const effectiveUser = currentUser || userData;

    let managedUsers = [];
    if (userRole === "SUPER ADMIN" || userRole === "super_admin") {
      managedUsers = users.filter((u) => u.id !== effectiveUser.id);
    } else if (userRole === "ADMIN" || userRole === "admin") {
      managedUsers = users.filter((u) => u.parentId === effectiveUser.id);
    }

    return {
      total: managedUsers.length,
      active: managedUsers.filter((u) => u.isActive).length,
      newThisWeek: managedUsers.filter((u) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(u.lastLogin) >= weekAgo;
      }).length,
    };
  };

  const managedUsersStats = getManagedUsersStats();

  // Recent transactions for quick view
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

  const getTypeColor = (type) => {
    return type === "payin" ? "text-green-600" : "text-red-600";
  };

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Refresh and Time Filter */}
      <HeaderSection
        title={`Welcome back, ${userName}`}
        tagLine={`${
          userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()
        } Dashboard • ${systemHealth.uptime}% Uptime`}
      />

      {/* System Alerts */}
      {(userRole === "ADMIN" ||
        userRole === "SUPER ADMIN" ||
        userRole === "admin" ||
        userRole === "super_admin") && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-800">System Health</h4>
                <p className="text-sm text-blue-600">
                  {systemHealth.activeSessions} active sessions •{" "}
                  {systemHealth.pendingTransactions} pending transactions
                </p>
            {systemHealth.failedLastHour > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  {systemHealth.failedLastHour} failures in last hour
                </span>
              </div>
            )}
              </div>
            </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <StateCard
            key={idx}
            {...card}
            loading={isLoading}
            onClick={idx === 0 ? () => navigate("/wallet") : undefined}
            className="cursor-pointer transition-transform hover:scale-105"
          />
        ))}
      </div>

      {/* Quick Actions Section */}
      {(userRole === "ADMIN" ||
        userRole === "SUPER ADMIN" ||
        userRole === "admin" ||
        userRole === "super_admin") && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            <div className="text-sm text-gray-500">Manage your platform</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => navigate("/users")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-teal-100"
            >
              <div className="flex items-center">
                <div className="bg-teal-100 group-hover:bg-teal-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <UserPlus className="h-6 w-6 text-teal-600" />
                </div>
                <div className="text-left">
                  <span className="block text-teal-700 font-semibold">
                    Manage Users
                  </span>
                  <span className="block text-teal-500 text-sm">
                    {managedUsersStats.total} users
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/commission")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-violet-100"
            >
              <div className="flex items-center">
                <div className="bg-violet-100 group-hover:bg-violet-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <Percent className="h-6 w-6 text-violet-600" />
                </div>
                <div className="text-left">
                  <span className="block text-violet-700 font-semibold">
                    Commission
                  </span>
                  <span className="block text-violet-500 text-sm">
                    Configure rates
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/reports")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-emerald-100"
            >
              <div className="flex items-center">
                <div className="bg-emerald-100 group-hover:bg-emerald-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <span className="block text-emerald-700 font-semibold">
                    Analytics
                  </span>
                  <span className="block text-emerald-500 text-sm">
                    View reports
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/transactions")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-amber-100"
            >
              <div className="flex items-center">
                <div className="bg-amber-100 group-hover:bg-amber-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <span className="block text-amber-700 font-semibold">
                    Transactions
                  </span>
                  <span className="block text-amber-500 text-sm">
                    Monitor activity
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout for Recent Activity and User Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate("/transactions")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All <Eye className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
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
                  <div>
                    <p className="font-medium text-gray-800">
                      {transaction.user?.firstName} {transaction.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {transaction.method} •{" "}
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${getTypeColor(
                      transaction.type
                    )}`}
                  >
                    {transaction.type === "payin" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
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

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Performance Metrics
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">
                  {stats.transactionCount}
                </p>
                <p className="text-sm text-blue-600">Total Transactions</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  {stats.successRate.toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">Success Rate</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">
                  {managedUsersStats.total}
                </p>
                <p className="text-sm text-purple-600">Managed Users</p>
                {managedUsersStats.newThisWeek > 0 && (
                  <p className="text-xs text-purple-500 mt-1">
                    +{managedUsersStats.newThisWeek} this week
                  </p>
                )}
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">
                  {stats.pendingTransactions}
                </p>
                <p className="text-sm text-orange-600">Pending</p>
              </div>
            </div>

            {/* Commission Efficiency */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Commission Efficiency
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {(
                    (stats.totalCommission / Math.max(stats.totalPayin, 1)) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (stats.totalCommission / Math.max(stats.totalPayin, 1)) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
