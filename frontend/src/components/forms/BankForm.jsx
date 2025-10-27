import React from "react";
import { Upload } from "lucide-react";

const BankForm = ({
  accountForm = {},
  onChange,
  onFileChange,
  onSubmit,
  onCancel,
  editingAccountId,
  accountTypes = [],
  errors = {}, // ✅ safe default
}) => {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-xs bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg shadow-lg w-full max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingAccountId ? "Edit Account" : "Add New Account"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Holder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name *
            </label>
            <input
              name="accountHolder"
              value={accountForm?.accountHolder || ""}
              onChange={onChange}
              placeholder="Enter account holder name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.accountHolder && (
              <p className="text-red-500 text-xs mt-1">
                {errors.accountHolder}
              </p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              name="accountNumber"
              value={accountForm?.accountNumber || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 18)
                  onChange({ target: { name: "accountNumber", value } });
              }}
              placeholder="Enter account number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.accountNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.accountNumber}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={accountForm?.phoneNumber || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10)
                  onChange({ target: { name: "phoneNumber", value } });
              }}
              placeholder="10-digit phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              name="accountType"
              value={accountForm?.accountType || ""}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.accountType && (
              <p className="text-red-500 text-xs mt-1">{errors.accountType}</p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code *
            </label>
            <input
              name="ifscCode"
              value={accountForm?.ifscCode || ""}
              onChange={onChange}
              placeholder="Enter IFSC code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
            {errors.ifscCode && (
              <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>
            )}
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <input
              name="bankName"
              value={accountForm?.bankName || ""}
              onChange={onChange}
              placeholder="Enter bank name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.bankName && (
              <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
            )}
          </div>

          {/* Bank Proof */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Proof Document
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600 truncate">
                  {accountForm?.bankProofFile
                    ? accountForm?.bankProofFile.name
                    : "Choose file..."}
                </span>
                <input
                  type="file"
                  onChange={onFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
              </label>
            </div>
            {errors.bankProofFile && (
              <p className="text-red-500 text-xs mt-1">
                {errors.bankProofFile}
              </p>
            )}
          </div>

          {/* Primary Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPrimary"
                checked={accountForm?.isPrimary || false}
                onChange={onChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Set as Primary Account
              </span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingAccountId ? "Update Account" : "Add Account"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankForm;
