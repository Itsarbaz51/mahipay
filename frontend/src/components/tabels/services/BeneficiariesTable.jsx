import React from "react";
import { Plus, Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";

const BeneficiariesTable = ({ beneficiaries, onAddBeneficiary }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">All Beneficiaries</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage bank account beneficiaries
          </p>
        </div>
        <button
          onClick={onAddBeneficiary}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Beneficiary</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Beneficiary ID
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Account
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                IFSC
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {beneficiaries.map((bene, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm font-mono text-blue-600 font-medium">
                  {bene.beneficiaryId}
                </td>
                <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                  {bene.name}
                </td>
                <td className="py-4 px-6 text-sm font-mono text-gray-600">
                  {bene.account}
                </td>
                <td className="py-4 px-6 text-sm font-mono text-gray-600">
                  {bene.ifsc}
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={bene.status} />
                </td>
                <td className="py-4 px-6">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BeneficiariesTable;
