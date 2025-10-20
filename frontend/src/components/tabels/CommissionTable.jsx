import { useState } from "react";
import { Search, Edit, Save, X, Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createOrUpdateCommissionSetting } from "../../redux/slices/commissionSlice";

// constants - updated to match your backend
const scopes = ["ROLE", "USER"];
const commissionTypes = ["FLAT", "PERCENT"];
const services = ["NEFT", "IMPS"]; // You might want to fetch these from your backend
const roles = ["STATE_HOLDER", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "AGENT"];

const CommissionTable = ({ chargesData, setChargesData }) => {
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmItem, setConfirmItem] = useState(null);

  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.currentUser);

  const filteredData = chargesData.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.commissionValue).includes(q) ||
      String(item.role?.name || "")
        .toLowerCase()
        .includes(q) ||
      String(item.service?.name || "")
        .toLowerCase()
        .includes(q) ||
      String(item.commissionType).toLowerCase().includes(q) ||
      String(item.scope).toLowerCase().includes(q)
    );
  });

  const updateChargeData = (id, field, value) => {
    setChargesData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "commissionValue" ||
                field === "minAmount" ||
                field === "maxAmount" ||
                field === "tdsPercent" ||
                field === "gstPercent"
                  ? Number(value)
                  : field === "applyTDS" || field === "applyGST"
                  ? value === "true"
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
      const payload = {
        scope: item.scope,
        roleId: item.roleId,
        targetUserId: item.targetUserId,
        serviceId: item.serviceId,
        commissionType: item.commissionType,
        commissionValue: item.commissionValue,
        minAmount: item.minAmount,
        maxAmount: item.maxAmount,
        applyTDS: item.applyTDS,
        tdsPercent: item.tdsPercent,
        applyGST: item.applyGST,
        gstPercent: item.gstPercent,
        effectiveFrom: item.effectiveFrom,
        effectiveTo: item.effectiveTo,
      };

      await dispatch(createOrUpdateCommissionSetting(payload));
      setEditingId(null);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleCancel = () => setEditingId(null);

  const confirmDelete = (item) => setConfirmItem(item);

  const handleDeleteConfirmed = async () => {
    if (!confirmItem) return;
    try {
      // Note: Your current backend doesn't have delete functionality
      // You'll need to add this to your service or handle it differently
      // For now, we'll just remove from local state
      setChargesData((prev) => prev.filter((c) => c.id !== confirmItem.id));
      toast.success("Commission setting removed locally");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete commission setting");
    }
    setConfirmItem(null);
  };

  // Format currency display
  const formatCurrency = (value) => {
    if (!value) return "-";
    return `₹${value}`;
  };

  // Format percentage display
  const formatPercentage = (value) => {
    if (!value) return "-";
    return `${value}%`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300">
      {/* Search */}
      <div className="p-4 border-b border-gray-300 flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by role, service, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-80"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-300">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium">#</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Scope</th>
            <th className="px-6 py-3 text-left text-xs font-medium">
              Role/User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium">Service</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Min/Max</th>
            <th className="px-6 py-3 text-left text-xs font-medium">TDS/GST</th>
            {currentUser.role === "ADMIN" && (
              <th className="px-6 py-3 text-left text-xs font-medium">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 border-b border-gray-200"
            >
              <td className="px-6 py-4">{index + 1}</td>

              {/* Scope */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <select
                    value={item.scope}
                    onChange={(e) =>
                      updateChargeData(item.id, "scope", e.target.value)
                    }
                    className="px-2 py-1 border rounded text-sm"
                  >
                    {scopes.map((scope) => (
                      <option key={scope} value={scope}>
                        {scope}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {item.scope}
                  </span>
                )}
              </td>

              {/* Role/User */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  item.scope === "ROLE" ? (
                    <select
                      value={item.roleId}
                      onChange={(e) =>
                        updateChargeData(item.id, "roleId", e.target.value)
                      }
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="User ID"
                      value={item.targetUserId || ""}
                      onChange={(e) =>
                        updateChargeData(
                          item.id,
                          "targetUserId",
                          e.target.value
                        )
                      }
                      className="w-32 px-2 py-1 border rounded text-sm"
                    />
                  )
                ) : (
                  <div className="text-sm">
                    {item.scope === "ROLE"
                      ? item.role?.name || item.roleId
                      : item.targetUser?.username || item.targetUserId}
                  </div>
                )}
              </td>

              {/* Service */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <select
                    value={item.serviceId}
                    onChange={(e) =>
                      updateChargeData(item.id, "serviceId", e.target.value)
                    }
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select Service</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                ) : (
                  item.service?.name || item.serviceId
                )}
              </td>

              {/* Commission Type */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <select
                    value={item.commissionType}
                    onChange={(e) =>
                      updateChargeData(
                        item.id,
                        "commissionType",
                        e.target.value
                      )
                    }
                    className="px-2 py-1 border rounded text-sm"
                  >
                    {commissionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.commissionType === "PERCENT"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {item.commissionType}
                  </span>
                )}
              </td>

              {/* Commission Value */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={item.commissionValue}
                    onChange={(e) =>
                      updateChargeData(
                        item.id,
                        "commissionValue",
                        e.target.value
                      )
                    }
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                ) : item.commissionType === "PERCENT" ? (
                  `${item.commissionValue}%`
                ) : (
                  formatCurrency(item.commissionValue)
                )}
              </td>

              {/* Min/Max Amount */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={item.minAmount || ""}
                      onChange={(e) =>
                        updateChargeData(item.id, "minAmount", e.target.value)
                      }
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={item.maxAmount || ""}
                      onChange={(e) =>
                        updateChargeData(item.id, "maxAmount", e.target.value)
                      }
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                ) : (
                  <div className="text-xs">
                    <div>Min: {formatCurrency(item.minAmount)}</div>
                    <div>Max: {formatCurrency(item.maxAmount)}</div>
                  </div>
                )}
              </td>

              {/* TDS/GST */}
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={item.applyTDS || false}
                        onChange={(e) =>
                          updateChargeData(
                            item.id,
                            "applyTDS",
                            e.target.checked
                          )
                        }
                        className="h-3 w-3"
                      />
                      <span className="text-xs">TDS</span>
                      <input
                        type="number"
                        placeholder="%"
                        value={item.tdsPercent || ""}
                        onChange={(e) =>
                          updateChargeData(
                            item.id,
                            "tdsPercent",
                            e.target.value
                          )
                        }
                        className="w-12 px-1 py-1 border rounded text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={item.applyGST || false}
                        onChange={(e) =>
                          updateChargeData(
                            item.id,
                            "applyGST",
                            e.target.checked
                          )
                        }
                        className="h-3 w-3"
                      />
                      <span className="text-xs">GST</span>
                      <input
                        type="number"
                        placeholder="%"
                        value={item.gstPercent || ""}
                        onChange={(e) =>
                          updateChargeData(
                            item.id,
                            "gstPercent",
                            e.target.value
                          )
                        }
                        className="w-12 px-1 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs">
                    {item.applyTDS && (
                      <div>TDS: {formatPercentage(item.tdsPercent)}</div>
                    )}
                    {item.applyGST && (
                      <div>GST: {formatPercentage(item.gstPercent)}</div>
                    )}
                    {!item.applyTDS && !item.applyGST && <div>-</div>}
                  </div>
                )}
              </td>

              {/* Actions */}
              {currentUser.role === "ADMIN" && (
                <td className="px-6 py-4">
                  {editingId === item.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="text-green-600 hover:text-green-800 p-2 rounded bg-green-50 hover:bg-green-100"
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded bg-gray-50 hover:bg-gray-100"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="text-blue-600 hover:text-blue-700 p-2 rounded bg-blue-50 hover:bg-blue-100"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        className="text-red-600 hover:text-red-700 p-2 rounded bg-red-50 hover:bg-red-100"
                        title="Delete"
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

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No commission settings found
        </div>
      )}

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

// ConfirmCard component (keep as is)
function ConfirmCard({ actionType, isClose, isSubmit }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">Confirm {actionType}</h2>
        <p className="mb-4">
          Are you sure you want to{" "}
          <span className="font-semibold">{actionType}</span> this commission
          setting?
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
