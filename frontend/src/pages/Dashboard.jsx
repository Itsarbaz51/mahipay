import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  UserPlus,
  Percent,
  BarChart3,
} from "lucide-react";
import HeaderSection from "../components/ui/HeaderSection";
import StateCard from "../components/ui/StateCard";

const Dashboard = ({
  currentUser,
  transactions,
  users,
  commissionSettings,
}) => {
  const navigate = useNavigate();

  const getUserStats = () => {
    const userTransactions = transactions.filter((t) => {
      if (currentUser.role === "super_admin") return true;
      if (currentUser.role === "admin") {
        const agentIds = users
          .filter((u) => u.parent_id === currentUser.id)
          .map((u) => u.id);
        return agentIds.includes(t.user_id) || t.user_id === currentUser.id;
      }
      return t.user_id === currentUser.id;
    });

    const totalPayin = userTransactions
      .filter((t) => t.type === "payin" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPayout = userTransactions
      .filter((t) => t.type === "payout" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = userTransactions.reduce(
      (sum, t) => sum + (t.commission || 0),
      0
    );

    return {
      totalPayin,
      totalPayout,
      totalCommission,
      transactionCount: userTransactions.length,
    };
  };

  const stats = getUserStats();
  const statCards = [
    {
      title: "Wallet Balance",
      value: `₹${currentUser?.user.walletBalance?.toLocaleString()}`,
      subText: "Available funds",
      icon: Wallet,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Payin",
      value: `₹${stats.totalPayin.toLocaleString()}`,
      subText: "Money received",
      icon: ArrowUpCircle,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Payout",
      value: `₹${stats.totalPayout.toLocaleString()}`,
      subText: "Money sent",
      icon: ArrowDownCircle,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Commission Earned",
      value: `₹${stats.totalCommission.toLocaleString()}`,
      subText: "Total earnings",
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <HeaderSection
        title={`Welcome back, ${currentUser?.user.firstName + " "+ currentUser?.user.lastName}`}
        tagLine={`${currentUser?.user.role.name} Dashboard`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <StateCard key={idx} {...card} />
        ))}
      </div>

      {/* Quick Actions Section */}
      {currentUser.role !== "agent" && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            <div className="text-sm text-gray-500">Manage your platform</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    Add & edit users
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
                    Commission Settings
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
                    View Reports
                  </span>
                  <span className="block text-emerald-500 text-sm">
                    Analytics & insights
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Activity Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {stats.transactionCount}
            </p>
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {users?.filter((u) =>
                currentUser.role === "super_admin"
                  ? true
                  : currentUser.role === "admin"
                  ? u.parent_id === currentUser.id
                  : false
              ).length || 0}
            </p>
            <p className="text-sm text-gray-600">Managed Users</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {(
                (stats.totalCommission / Math.max(stats.totalPayin, 1)) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-sm text-gray-600">Commission Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
