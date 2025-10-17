import { useState } from "react";
import { Search, Edit, Save, X, Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateCommission,
  deleteCommission,
} from "../../redux/slices/commissionSlice";

// constants
const roles = ["STATE_HOLDER", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "AGENT"];
const services = ["NEFT", "IMPS"];
const types = ["FIXED", "PERCENT"];

const CommissionTable = ({ chargesData, setChargesData }) => {
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmItem, setConfirmItem] = useState(null); // item for confirmation modal

  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.currentUser);

  const filteredData = chargesData.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.from).includes(q) ||
      String(item.to).includes(q) ||
      String(item.value).includes(q) ||
      String(item.role).toLowerCase().includes(q) ||
      String(item.service).toLowerCase().includes(q)
    );
  });

  const updateChargeData = (id, field, value) => {
    setChargesData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "from" || field === "to" || field === "value"
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  };

  const handleSave = async (id) => {
    const item = chargesData.find((c) => c.id === id);
    if (!item) return;

    try {
      await dispatch(
        updateCommission(id, {
          from: item.from,
          to: item.to,
          value: item.value,
          type: item.type,
          role: item.role,
          service: item.service,
        })
      );
    } catch (err) {
      console.error("Update failed", err);
    }
    setEditingId(null);
  };

  const handleCancel = () => setEditingId(null);

  const confirmDelete = (item) => setConfirmItem(item);

  const handleDeleteConfirmed = async () => {
    if (!confirmItem) return;
    try {
      await dispatch(deleteCommission(confirmItem.id));
      setChargesData((prev) => prev.filter((c) => c.id !== confirmItem.id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete slab");
    }
    setConfirmItem(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300">
      {/* Search */}
      <div className="p-4 border-b border-gray-300 flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-300">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium">#</th>
            <th className="px-6 py-3 text-left text-xs font-medium">From</th>
            <th className="px-6 py-3 text-left text-xs font-medium">To</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Service</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Role</th>
            {currentUser.role === "ADMIN" && (
              <th className="px-6 py-3 text-left text-xs font-medium">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-3">{index + 1}</td>
              <td className="px-6 py-3">
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={item.from}
                    onChange={(e) =>
                      updateChargeData(item.id, "from", e.target.value)
                    }
                    className="w-24 px-2 py-1 border rounded"
                  />
                ) : (
                  item.from
                )}
              </td>
              <td className="px-6 py-3">
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={item.to}
                    onChange={(e) =>
                      updateChargeData(item.id, "to", e.target.value)
                    }
                    className="w-24 px-2 py-1 border rounded"
                  />
                ) : (
                  item.to
                )}
              </td>
              <td className="px-6 py-3">
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) =>
                      updateChargeData(item.id, "value", e.target.value)
                    }
                    className="w-24 px-2 py-1 border rounded"
                  />
                ) : (
                  `₹${item.value}`
                )}
              </td>
              <td className="px-6 py-3">
                {editingId === item.id ? (
                  <select
                    value={item.type}
                    onChange={(e) =>
                      updateChargeData(item.id, "type", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  item.type
                )}
              </td>
              <td className="px-6 py-3">{item.service}</td>
              <td className="px-6 py-3">
                {editingId === item.id ? (
                  <select
                    value={item.role}
                    onChange={(e) =>
                      updateChargeData(item.id, "role", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  item.role
                )}
              </td>
              {currentUser.role === "ADMIN" && (
                <td className="px-6 py-3">
                  {editingId === item.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="text-blue-600 hover:text-blue-700 p-2 rounded bg-blue-50 hover:bg-blue-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        className="text-red-600 hover:text-red-700 p-2 rounded bg-red-50 hover:bg-red-100"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ConfirmCard modal */}
      {confirmItem && (
        <ConfirmCard
          actionType="Delete"
          isClose={() => setConfirmItem(null)}
          isSubmit={handleDeleteConfirmed}
        />
      )}
    </div>
  );
};

// ConfirmCard component
function ConfirmCard({ actionType, isClose, isSubmit }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">Confirm {actionType}</h2>
        <p className="mb-4">
          Are you sure you want to{" "}
          <span className="font-semibold">{actionType}</span> this commission
          slab?
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={isClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={isSubmit}
            className={`px-4 py-2 rounded-lg text-white ${
              actionType === "Delete" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommissionTable;
