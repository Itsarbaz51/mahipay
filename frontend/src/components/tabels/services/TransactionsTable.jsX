import React from "react";
import { ExternalLink, Filter, Copy } from "lucide-react";
import StatusBadge from "./StatusBadge";

const TransactionsTable = ({ transactions, onNewTransaction }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">All Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete transaction history and details
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={onNewTransaction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Create Collection URL</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Beneficiary
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                UTR
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((txn, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm font-mono text-blue-600 font-medium">
                  {txn.id}
                </td>
                <td className="py-4 px-6 text-sm text-gray-900">
                  {txn.beneficiary}
                </td>
                <td className="py-4 px-6 text-sm font-bold text-gray-900">
                  {txn.amount}
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">{txn.type}</td>
                <td className="py-4 px-6">
                  {txn.utr !== "-" ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-600">
                        {txn.utr}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={txn.status} />
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{txn.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
