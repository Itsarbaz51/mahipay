import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MoreVertical, Check, Shield } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addBank,
  getAllMyBanks,
  // updateBank,
  // deleteBank,
} from "../redux/slices/bankSlice";
import BankForm from "../components/forms/BankForm";

export const AccountType = Object.freeze({
  PERSONAL: "PERSONAL",
  BUSINESS: "BUSINESS",
});

const CompanyAccounts = () => {
  const dispatch = useDispatch();
  const [accountForm, setAccountForm] = useState({
    accountHolder: "",
    accountNumber: "",
    phoneNumber: "",
    accountType: AccountType.PERSONAL,
    ifscCode: "",
    bankName: "",
    bankProofFile: null,
    isPrimary: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const accountTypes = [
    { value: AccountType.PERSONAL, label: "Personal Account" },
    { value: AccountType.BUSINESS, label: "Business Account" },
  ];

  const { banks = [] } = useSelector((state) => state.bank);

  useEffect(() => {
    dispatch(getAllMyBanks());
  }, [dispatch]);

  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAccountForm((prev) => ({ ...prev, bankProofFile: file }));
      if (formErrors.bankProofFile) {
        setFormErrors((prev) => ({ ...prev, bankProofFile: "" }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!accountForm.accountHolder.trim())
      errors.accountHolder = "Account holder name is required.";
    if (!accountForm.accountNumber.trim())
      errors.accountNumber = "Account number is required.";
    else if (
      accountForm.accountNumber.length < 9 ||
      accountForm.accountNumber.length > 18
    )
      errors.accountNumber = "Account number must be between 9 and 18 digits.";
    if (!accountForm.phoneNumber.trim())
      errors.phoneNumber = "Phone number is required.";
    else if (!/^\d{10}$/.test(accountForm.phoneNumber))
      errors.phoneNumber = "Phone number must be exactly 10 digits.";
    if (!accountForm.ifscCode.trim())
      errors.ifscCode = "IFSC code is required.";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountForm.ifscCode.toUpperCase()))
      errors.ifscCode = "Enter a valid IFSC code (e.g., SBIN0001234).";
    if (!accountForm.bankName.trim())
      errors.bankName = "Bank name is required.";
    if (!Object.values(AccountType).includes(accountForm.accountType))
      errors.accountType = "Invalid account type.";
    if (!editingAccountId && !accountForm.bankProofFile)
      errors.bankProofFile = "Bank proof file is required.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setAccountForm({
      accountHolder: "",
      accountNumber: "",
      phoneNumber: "",
      accountType: AccountType.PERSONAL,
      ifscCode: "",
      bankName: "",
      bankProofFile: null,
      isPrimary: false,
    });
    setFormErrors({});
    setEditingAccountId(null);
    setShowAccountForm(false);
  };

  const handleAddAccount = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    Object.entries(accountForm).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value);
    });

    await dispatch(addBank(formData));
    await dispatch(getAllMyBanks());
    resetForm();
  };

  const handleEditAccount = (account) => {
    setAccountForm({
      accountHolder: account.accountHolder,
      accountNumber: account.accountNumber,
      phoneNumber: account.phoneNumber,
      accountType: account.accountType,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      bankProofFile: null,
      isPrimary: account.isPrimary,
    });
    setEditingAccountId(account.id);
    setShowAccountForm(true);
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  return (
    <div className="">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Company Bank Accounts
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your company's banking information
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Bank Accounts
            </h2>
            <button
              onClick={() => setShowAccountForm(!showAccountForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banks?.data?.length ? (
                  banks.data.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      {console.log(account)}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(account.accountHolder || "NA")}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {account.accountHolder || "-"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {account.phoneNumber || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {String(account.accountNumber || "-")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            account.accountType === AccountType.BUSINESS
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {account.accountType === AccountType.BUSINESS
                            ? "Business"
                            : "Personal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {account.bankName || "-"} <br />
                        <span className="text-xs text-gray-500">
                          IFSC: {account.ifscCode || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
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

        {showAccountForm && (
          <BankForm
            accountForm={accountForm}
            errors={formErrors} // ✅ fixed
            accountTypes={accountTypes}
            onChange={handleAccountChange}
            onFileChange={handleFileChange}
            onSubmit={editingAccountId ? handleEditAccount : handleAddAccount}
            onCancel={resetForm}
            editingAccountId={editingAccountId}
          />
        )}
      </div>
    </div>
  );
};

export default CompanyAccounts;
