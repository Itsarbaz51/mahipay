import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addBank,
  getAllMyBanks,
  updateBank,
  deleteBank,
} from "../redux/slices/bankSlice";
import AddBank from "../components/forms/AddBank";

export const AccountType = Object.freeze({
  PERSONAL: "PERSONAL",
  BUSINESS: "BUSINESS",
});

const statusStyles = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-green-100 text-green-700",
  REJECT: "bg-red-100 text-red-700",
};

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

  const { myBankList, isLoading } = useSelector((state) => state.bank);

  useEffect(() => {
    dispatch(getAllMyBanks());
  }, [dispatch]);

  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        setFormErrors((prev) => ({
          ...prev,
          bankProofFile: "File size should not exceed 3 MB.",
        }));
        setAccountForm((prev) => ({ ...prev, bankProofFile: null }));
        return;
      }

      setAccountForm((prev) => ({ ...prev, bankProofFile: file }));
      if (formErrors.bankProofFile)
        setFormErrors((prev) => ({ ...prev, bankProofFile: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!accountForm.accountHolder.trim())
      errors.accountHolder = "Account holder name is required.";
    if (!accountForm.accountNumber.trim())
      errors.accountNumber = "Account number is required.";
    if (!accountForm.phoneNumber.trim())
      errors.phoneNumber = "Phone number is required.";
    if (!accountForm.ifscCode.trim())
      errors.ifscCode = "IFSC code is required.";
    if (!accountForm.bankName.trim())
      errors.bankName = "Bank name is required.";
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

  const handleEditAccount = async () => {
    if (!validateForm()) return;
    const formData = new FormData();
    Object.entries(accountForm).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value);
    });
    await dispatch(updateBank({ id: editingAccountId, data: formData }));
    await dispatch(getAllMyBanks());
    resetForm();
  };

  const handleEditClick = (account) => {
    setAccountForm({
      accountHolder: account.accountHolder,
      accountNumber: account.accountNumber,
      phoneNumber: account.phoneNumber,
      accountType: account.accountType,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      bankProofFile: account.bankProofFile || null,
      isPrimary: account.isPrimary,
    });
    setEditingAccountId(account.id);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      await dispatch(deleteBank(id));
      await dispatch(getAllMyBanks());
    }
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
        <h1 className="text-3xl font-bold ">Bank Accounts</h1>
        <p className="text-gray-600 mt-1">
          Manage your company's banking information
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold ">Bank Accounts</h2>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Account Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bank Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.values(myBankList || []).filter(Boolean).length > 0 ? (
                  Object.values(myBankList || [])
                    .filter((account) => account && typeof account === "object")
                    .map((account, i) => (
                      <React.Fragment key={account.id || account.accountNumber}>
                        {account?.bankRejectionReason && (
                          <tr key={i} className="bg-red-50">
                            <td
                              colSpan={6}
                              className="px-6 py-3 text-red-700 text-sm font-medium"
                            >
                              Rejection Reason: "{account.bankRejectionReason}"
                              for this account number {account.accountNumber}
                            </td>
                          </tr>
                        )}
                        <tr
                          key={account.id || Math.random()}
                          className={`hover:bg-gray-50 ${
                            account?.bankRejectionReason &&
                            "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                                {getInitials(account?.accountHolder || "NA")}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium ">
                                  {account?.accountHolder || "-"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {account?.phoneNumber || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-sm ">
                            {String(account?.accountNumber || "-")}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                account?.accountType === AccountType.BUSINESS
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {account?.accountType === AccountType.BUSINESS
                                ? "Business"
                                : "Personal"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {account?.status ? (
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  statusStyles[account.status.toUpperCase()] ||
                                  "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {account.status}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm  flex items-center space-x-3">
                            {account?.bankProofFile ? (
                              <a
                                href={account.bankProofFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={account.bankProofFile}
                                  alt={account.bankName || "Bank Proof"}
                                  className="w-12 h-12 object-cover rounded-md border border-gray-200 hover:scale-105 transition-transform"
                                />
                              </a>
                            ) : (
                              <div className="w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                            <div>
                              {account?.bankName || "-"} <br />
                              <span className="text-xs text-gray-500">
                                IFSC: {account?.ifscCode || "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 space-x-3">
                            <button
                              onClick={() => handleEditClick(account)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account?.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                ) : (
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

        {showAccountForm && (
          <AddBank
            accountForm={accountForm}
            errors={formErrors}
            accountTypes={Object.values(AccountType).map((t) => ({
              value: t,
              label: t === "PERSONAL" ? "Personal Account" : "Business Account",
            }))}
            onChange={handleAccountChange}
            onFileChange={handleFileChange}
            onSubmit={editingAccountId ? handleEditAccount : handleAddAccount}
            onCancel={resetForm}
            editingAccountId={editingAccountId}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default CompanyAccounts;
