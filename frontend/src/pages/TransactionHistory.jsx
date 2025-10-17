import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Download,
  DollarSign,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const TransactionHistory = ({
  currentUser = { id: 1, role: "super_admin", name: "Admin User" },
  transactions = [],
  users = [],
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Sample data if none provided
  const sampleTransactions =
    transactions.length > 0
      ? transactions
      : [
          {
            id: 1,
            user_id: 1,
            type: "payin",
            amount: 15000,
            commission: 150,
            status: "success",
            created_at: "2024-09-01T10:30:00Z",
            razorpay_order_id: "order_MkXvY8zN9pQ7Rt",
          },
          {
            id: 2,
            user_id: 2,
            type: "payout",
            amount: 8500,
            commission: 85,
            status: "pending",
            created_at: "2024-09-02T14:15:00Z",
            razorpay_payout_id: "pout_MkXvY8zN9pQ7Rt",
          },
          {
            id: 3,
            user_id: 1,
            type: "payin",
            amount: 25000,
            commission: 250,
            status: "failed",
            created_at: "2024-09-03T09:45:00Z",
            razorpay_order_id: "order_NkXvY8zN9pQ7Rt",
          },
          {
            id: 4,
            user_id: 3,
            type: "payout",
            amount: 12000,
            commission: 120,
            status: "success",
            created_at: "2024-09-03T16:20:00Z",
            razorpay_payout_id: "pout_NkXvY8zN9pQ7Rt",
          },
          {
            id: 5,
            user_id: 2,
            type: "payin",
            amount: 5000,
            commission: 50,
            status: "pending",
            created_at: "2024-09-04T11:10:00Z",
            razorpay_order_id: "order_OkXvY8zN9pQ7Rt",
          },
        ];

  const sampleUsers =
    users.length > 0
      ? users
      : [
          { id: 1, name: "Admin User", parent_id: null, role: "super_admin" },
          { id: 2, name: "Harmeek Singh", parent_id: 1, role: "agent" },
          { id: 3, name: "Priya Sharma", parent_id: 1, role: "agent" },
          { id: 4, name: "Rajesh Kumar", parent_id: 2, role: "agent" },
        ];

  // ✅ Fix: Helper functions
  const getUserName = (userId) => {
    const user = sampleUsers.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  const getUserInitials = (userId) => {
    const user = sampleUsers.find((u) => u.id === userId);
    if (!user || !user.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userTransactions = sampleTransactions.filter((t) => {
    if (currentUser.role === "super_admin") return true;
    if (currentUser.role === "admin") {
      const agentIds = sampleUsers
        .filter((u) => u.parent_id === currentUser.id)
        .map((u) => u.id);
      return agentIds.includes(t.user_id) || t.user_id === currentUser.id;
    }
    return t.user_id === currentUser.id;
  });

  const filteredTransactions = userTransactions.filter((transaction) => {
    const matchesSearch =
      getUserName(transaction.user_id)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (transaction.razorpay_order_id &&
        transaction.razorpay_order_id
          .toLowerCase()
          .includes(search.toLowerCase())) ||
      (transaction.razorpay_payout_id &&
        transaction.razorpay_payout_id
          .toLowerCase()
          .includes(search.toLowerCase())) ||
      transaction.amount.toString().includes(search);

    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      failed: "bg-red-100 text-red-800 border border-red-200",
      pending: "bg-amber-100 text-amber-800 border border-amber-200",
    };

    return (
      statusClasses[status] ||
      "bg-gray-100 text-gray-800 border border-gray-300"
    );
  };

  const getTotalAmount = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalCommission = () => {
    return filteredTransactions.reduce(
      (sum, t) => sum + (t.commission || 0),
      0
    );
  };

  const getSuccessRate = () => {
    const total = filteredTransactions.length;
    const successful = filteredTransactions.filter(
      (t) => t.status === "success"
    ).length;
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className=" bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Transaction History
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor all payment transactions and commissions
              </p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{getTotalAmount().toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Commission
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{getTotalCommission().toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {getSuccessRate()}%
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredTransactions.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="payin">Pay In</option>
                  <option value="payout">Pay Out</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  {currentUser.role !== "agent" && (
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(transaction.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(transaction.created_at)}
                      </div>
                    </td>

                    {/* User (if not agent) */}
                    {currentUser.role !== "agent" && (
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                            {getUserInitials(transaction.user_id)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {getUserName(transaction.user_id)}
                            </p>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Transaction Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-lg mr-3 ${
                            transaction.type === "payin"
                              ? "bg-blue-100"
                              : "bg-orange-100"
                          }`}
                        >
                          {transaction.type === "payin" ? (
                            <ArrowDownCircle className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.type === "payin"
                              ? "Pay In"
                              : "Pay Out"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.type === "payin"
                              ? "Money Received"
                              : "Money Sent"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{transaction.amount.toLocaleString()}
                      </div>
                    </td>

                    {/* Commission */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ₹{(transaction.commission || 0).toFixed(2)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          transaction.status
                        )}`}
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1.5 capitalize">
                          {transaction.status}
                        </span>
                      </span>
                    </td>

                    {/* Transaction ID */}
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {transaction.razorpay_order_id ||
                          transaction.razorpay_payout_id}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No transactions found
                  </h3>
                  <p className="text-sm">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-300 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium">
                    {filteredTransactions.length}
                  </span>{" "}
                  transactions
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                    Previous
                  </button>
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
