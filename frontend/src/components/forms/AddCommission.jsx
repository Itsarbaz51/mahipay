import { useState } from "react";
import { Plus } from "lucide-react";
import { useDispatch } from "react-redux";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import ButtonField from "../ui/ButtonField";
import { createOrUpdateCommissionSetting } from "../../redux/slices/commissionSlice";
import { toast } from "react-toastify";

const scopes = ["ROLE", "USER"];
const roles = ["STATE_HOLDER", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "AGENT"];
const services = ["NEFT", "IMPS"];
const commissionTypes = ["FLAT", "PERCENT"];

const AddCommission = ({ chargesData, setChargesData }) => {
  const dispatch = useDispatch();

  const [newCommission, setNewCommission] = useState({
    scope: "ROLE",
    roleId: "",
    targetUserId: "",
    serviceId: "",
    commissionType: "FLAT",
    commissionValue: "",
    minAmount: "",
    maxAmount: "",
    applyTDS: false,
    tdsPercent: "",
    applyGST: false,
    gstPercent: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddCommission = async () => {
    // Validate required fields
    if (!newCommission.serviceId || !newCommission.commissionValue) {
      alert("Please fill Service and Commission Value fields");
      return;
    }

    // Validate scope-specific fields
    if (newCommission.scope === "ROLE" && !newCommission.roleId) {
      alert("Please select a Role for ROLE scope");
      return;
    }

    if (newCommission.scope === "USER" && !newCommission.targetUserId) {
      alert("Please enter User ID for USER scope");
      return;
    }

    // Check for duplicates
    const exists = chargesData.some(
      (item) =>
        item.scope === newCommission.scope &&
        item.serviceId === newCommission.serviceId &&
        ((newCommission.scope === "ROLE" &&
          item.roleId === newCommission.roleId) ||
          (newCommission.scope === "USER" &&
            item.targetUserId === newCommission.targetUserId))
    );

    if (exists) {
      alert(
        "Commission setting already exists for this scope, service, and target"
      );
      return;
    }

    try {
      setLoading(true);

      // Prepare payload according to backend schema
      const payload = {
        scope: newCommission.scope,
        serviceId: newCommission.serviceId,
        commissionType: newCommission.commissionType,
        commissionValue: Number(newCommission.commissionValue),
        minAmount: newCommission.minAmount
          ? Number(newCommission.minAmount)
          : undefined,
        maxAmount: newCommission.maxAmount
          ? Number(newCommission.maxAmount)
          : undefined,
        applyTDS: newCommission.applyTDS,
        tdsPercent: newCommission.tdsPercent
          ? Number(newCommission.tdsPercent)
          : undefined,
        applyGST: newCommission.applyGST,
        gstPercent: newCommission.gstPercent
          ? Number(newCommission.gstPercent)
          : undefined,
        effectiveFrom: newCommission.effectiveFrom,
        effectiveTo: newCommission.effectiveTo || undefined,
      };

      // Add scope-specific field
      if (newCommission.scope === "ROLE") {
        payload.roleId = newCommission.roleId;
      } else if (newCommission.scope === "USER") {
        payload.targetUserId = newCommission.targetUserId;
      }

      const result = await dispatch(createOrUpdateCommissionSetting(payload));

      const created =
        result?.payload?.data || result?.payload || result?.data || null;

      if (created && created.id) {
        setChargesData((prev) => [...prev, created]);
        toast.success("Commission setting added successfully");

        // Reset form
        setNewCommission({
          scope: "ROLE",
          roleId: "",
          targetUserId: "",
          serviceId: "",
          commissionType: "FLAT",
          commissionValue: "",
          minAmount: "",
          maxAmount: "",
          applyTDS: false,
          tdsPercent: "",
          applyGST: false,
          gstPercent: "",
          effectiveFrom: new Date().toISOString().split("T")[0],
          effectiveTo: "",
        });
      }
    } catch (err) {
      console.error("Add commission failed", err);
      toast.error(err?.message || "Failed to add commission setting");
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope) => {
    setNewCommission({
      ...newCommission,
      scope,
      roleId: scope === "ROLE" ? newCommission.roleId : "",
      targetUserId: scope === "USER" ? newCommission.targetUserId : "",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 mb-6 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Add New Commission Setting
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        {/* Scope */}
        <SelectField
          name="scope"
          label="Scope"
          value={newCommission.scope}
          handleChange={(e) => handleScopeChange(e.target.value)}
          options={scopes.map((scope) => ({ value: scope, label: scope }))}
        />

        {/* Role (only for ROLE scope) */}
        {newCommission.scope === "ROLE" && (
          <SelectField
            name="roleId"
            label="Role"
            value={newCommission.roleId}
            handleChange={(e) =>
              setNewCommission({ ...newCommission, roleId: e.target.value })
            }
            options={[
              { value: "", label: "Select Role" },
              ...roles.map((role) => ({ value: role, label: role })),
            ]}
          />
        )}

        {/* User ID (only for USER scope) */}
        {newCommission.scope === "USER" && (
          <InputField
            name="targetUserId"
            inputType="text"
            placeholderName="User ID"
            valueData={newCommission.targetUserId}
            handleChange={(e) =>
              setNewCommission({
                ...newCommission,
                targetUserId: e.target.value,
              })
            }
          />
        )}

        {/* Service */}
        <SelectField
          name="serviceId"
          label="Service"
          value={newCommission.serviceId}
          handleChange={(e) =>
            setNewCommission({ ...newCommission, serviceId: e.target.value })
          }
          options={[
            { value: "", label: "Select Service" },
            ...services.map((service) => ({ value: service, label: service })),
          ]}
        />

        {/* Commission Type */}
        <SelectField
          name="commissionType"
          label="Commission Type"
          value={newCommission.commissionType}
          handleChange={(e) =>
            setNewCommission({
              ...newCommission,
              commissionType: e.target.value,
            })
          }
          options={commissionTypes.map((type) => ({
            value: type,
            label: type,
          }))}
        />

        {/* Commission Value */}
        <InputField
          name="commissionValue"
          inputType="number"
          placeholderName={`Commission Value ${
            newCommission.commissionType === "PERCENT" ? "(%)" : "(₹)"
          }`}
          valueData={newCommission.commissionValue}
          handleChange={(e) =>
            setNewCommission({
              ...newCommission,
              commissionValue: e.target.value,
            })
          }
        />

        {/* Min Amount */}
        <InputField
          name="minAmount"
          inputType="number"
          placeholderName="Min Amount (₹)"
          valueData={newCommission.minAmount}
          handleChange={(e) =>
            setNewCommission({ ...newCommission, minAmount: e.target.value })
          }
        />

        {/* Max Amount */}
        <InputField
          name="maxAmount"
          inputType="number"
          placeholderName="Max Amount (₹)"
          valueData={newCommission.maxAmount}
          handleChange={(e) =>
            setNewCommission({ ...newCommission, maxAmount: e.target.value })
          }
        />

        {/* TDS Settings */}
        <div className="flex items-end space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="applyTDS"
              checked={newCommission.applyTDS}
              onChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  applyTDS: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="applyTDS"
              className="ml-2 block text-sm text-gray-900"
            >
              Apply TDS
            </label>
          </div>
          {newCommission.applyTDS && (
            <InputField
              name="tdsPercent"
              inputType="number"
              placeholderName="TDS %"
              valueData={newCommission.tdsPercent}
              handleChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  tdsPercent: e.target.value,
                })
              }
              className="flex-1"
            />
          )}
        </div>

        {/* GST Settings */}
        <div className="flex items-end space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="applyGST"
              checked={newCommission.applyGST}
              onChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  applyGST: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="applyGST"
              className="ml-2 block text-sm text-gray-900"
            >
              Apply GST
            </label>
          </div>
          {newCommission.applyGST && (
            <InputField
              name="gstPercent"
              inputType="number"
              placeholderName="GST %"
              valueData={newCommission.gstPercent}
              handleChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  gstPercent: e.target.value,
                })
              }
              className="flex-1"
            />
          )}
        </div>

        {/* Effective From */}
        <InputField
          name="effectiveFrom"
          inputType="date"
          placeholderName="Effective From"
          valueData={newCommission.effectiveFrom}
          handleChange={(e) =>
            setNewCommission({
              ...newCommission,
              effectiveFrom: e.target.value,
            })
          }
        />

        {/* Effective To */}
        <InputField
          name="effectiveTo"
          inputType="date"
          placeholderName="Effective To (Optional)"
          valueData={newCommission.effectiveTo}
          handleChange={(e) =>
            setNewCommission({ ...newCommission, effectiveTo: e.target.value })
          }
        />
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <ButtonField
          type="submit"
          isDisabled={loading}
          icon={Plus}
          onClick={handleAddCommission}
          isOpen={null}
          name={loading ? "Adding..." : "Add Commission Setting"}
        />
      </div>
    </div>
  );
};

export default AddCommission;
