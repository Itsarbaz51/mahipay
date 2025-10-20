import { useState } from "react";
import { Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";


const CompanyAccounts = () => {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      holderName: "AZU",
      accountNumber: "34621114254",
      ifsc: "SBIN0004655",
      bankName: "State Bank of India",
    },
  ]);
  const [accountForm, setAccountForm] = useState({
    holderName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAccount = () => {
    if (
      !accountForm.holderName ||
      !accountForm.accountNumber ||
      !accountForm.ifsc ||
      !accountForm.bankName
    )
      return;

    const newAccount = {
      id: Date.now(),
      ...accountForm,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setAccountForm({
      holderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    });
    setShowAccountForm(false);
  };

  const handleEditAccount = (id) => {
    const acc = accounts.find((acc) => acc.id === id);
    if (acc) {
      setAccountForm({
        holderName: acc.holderName,
        accountNumber: acc.accountNumber,
        ifsc: acc.ifsc,
        bankName: acc.bankName,
      });
      setEditingAccountId(id);
      setShowAccountForm(true);
    }
  };

  const handleUpdateAccount = () => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === editingAccountId ? { ...acc, ...accountForm } : acc
      )
    );
    setEditingAccountId(null);
    setAccountForm({
      holderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    });
    setShowAccountForm(false);
  };

  const handleDeleteAccount = (id) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="">
      <PageHeader
        breadcrumb={["Dashboard", "Settings", "Company Accounts"]}
        title="Company Bank Accounts"
        description="Manage your company's banking information"
      />

      <div className="space-y-6 mt-8">
        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Company Bank Accounts
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage your company's banking information
              </p>
            </div>
            <button
              onClick={() => setShowAccountForm(!showAccountForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </button>
          </div>

          {/* Account Form */}
          {showAccountForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAccountId ? "Edit Account" : "Add New Account"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    name="holderName"
                    value={accountForm.holderName}
                    onChange={handleAccountChange}
                    placeholder="Enter account holder name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    name="accountNumber"
                    value={accountForm.accountNumber}
                    onChange={handleAccountChange}
                    placeholder="Enter account number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    name="ifsc"
                    value={accountForm.ifsc}
                    onChange={handleAccountChange}
                    placeholder="Enter IFSC code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    name="bankName"
                    value={accountForm.bankName}
                    onChange={handleAccountChange}
                    placeholder="Enter bank name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={
                    editingAccountId ? handleUpdateAccount : handleAddAccount
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingAccountId ? "Update Account" : "Add Account"}
                </button>
                <button
                  onClick={() => {
                    setShowAccountForm(false);
                    setEditingAccountId(null);
                    setAccountForm({
                      holderName: "",
                      accountNumber: "",
                      ifsc: "",
                      bankName: "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Accounts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACCOUNT HOLDER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACCOUNT NUMBER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IFSC CODE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BANK NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(account.holderName)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {account.holderName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Account Holder
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {account.accountNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                        {account.ifsc}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {account.bankName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAccount(account.id)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-lg mb-2">
                        No accounts found
                      </div>
                      <div className="text-gray-500 text-sm">
                        Add your first company account to get started
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAccounts;
