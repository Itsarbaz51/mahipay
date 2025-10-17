import React, { useState } from "react";

const CompanyAccount = () => {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      holderName: "AZU",
      accountNumber: "34621114254",
      ifsc: "SBIN0004655",
      bankName: "SBIN",
    },
  ]);

  const [form, setForm] = useState({
    holderName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });

  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!form.holderName || !form.accountNumber || !form.ifsc || !form.bankName)
      return;

    const newAccount = {
      id: Date.now(),
      ...form,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setForm({ holderName: "", accountNumber: "", ifsc: "", bankName: "" });
  };

  const handleEdit = (id) => {
    const acc = accounts.find((acc) => acc.id === id);
    if (acc) {
      setForm({
        holderName: acc.holderName,
        accountNumber: acc.accountNumber,
        ifsc: acc.ifsc,
        bankName: acc.bankName,
      });
      setEditingId(id);
    }
  };

  const handleUpdate = () => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === editingId ? { ...acc, ...form } : acc))
    );
    setEditingId(null);
    setForm({ holderName: "", accountNumber: "", ifsc: "", bankName: "" });
  };

  const handleDelete = (id) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  return (
    <div className="p-6 bg-gray-100 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add/Edit Form */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">
            Add Company Account
          </h2>

          <div className="space-y-4">
            <input
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              placeholder="Account Number"
              className="w-full border p-2 rounded"
            />
            <input
              name="ifsc"
              value={form.ifsc}
              onChange={handleChange}
              placeholder="IFSC Code"
              className="w-full border p-2 rounded"
            />
            <input
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              placeholder="Bank Name"
              className="w-full border p-2 rounded"
            />
            <input
              name="holderName"
              value={form.holderName}
              onChange={handleChange}
              placeholder="Account Holder Name"
              className="w-full border p-2 rounded"
            />
            {editingId ? (
              <button
                onClick={handleUpdate}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Update Account
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded"
              >
                Add Account
              </button>
            )}
          </div>
        </div>

        {/* Account List */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">
            Account List
          </h2>
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2">#</th>
                <th className="border px-3 py-2">Account Holder Name</th>
                <th className="border px-3 py-2">Account Number</th>
                <th className="border px-3 py-2">IFSC</th>
                <th className="border px-3 py-2">Bank Name</th>
                <th className="border px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, index) => (
                <tr key={acc.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-3 py-2 text-center">{index + 1}</td>
                  <td className="border px-3 py-2">{acc.holderName}</td>
                  <td className="border px-3 py-2">{acc.accountNumber}</td>
                  <td className="border px-3 py-2">{acc.ifsc}</td>
                  <td className="border px-3 py-2">{acc.bankName}</td>
                  <td className="border px-3 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(acc.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanyAccount;
