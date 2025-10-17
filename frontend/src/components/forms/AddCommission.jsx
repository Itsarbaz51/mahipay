import { useState } from "react";
import { Plus } from "lucide-react";
import { useDispatch } from "react-redux";
import { addCommission } from "../../redux/slices/commissionSlice";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import ButtonField from "../ui/ButtonField";

const roles = ["STATE_HOLDER", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "AGENT"];
const services = ["NEFT", "IMPS"];
const types = ["FIXED", "PERCENT"];

const AddCommission = ({ chargesData, setChargesData }) => {
  const dispatch = useDispatch();

  const [newSlab, setNewSlab] = useState({
    from: "",
    to: "",
    value: "",
    type: "FIXED",
    role: "",
    service: "NEFT",
  });
  const [loading, setLoading] = useState(false);

  const handleAddSlab = async () => {
    if (
      newSlab.from === "" ||
      newSlab.to === "" ||
      newSlab.value === "" ||
      !newSlab.role ||
      !newSlab.service ||
      !newSlab.type
    ) {
      alert("Please fill all fields and select role/service/type");
      return;
    }

    const exists = chargesData.some(
      (s) =>
        s.role === newSlab.role &&
        s.service === newSlab.service &&
        Number(s.from) === Number(newSlab.from) &&
        Number(s.to) === Number(newSlab.to)
    );
    if (exists) {
      alert("This exact slab already exists for selected role and service");
      return;
    }

    try {
      setLoading(true);
      const result = await dispatch(
        addCommission({
          role: newSlab.role,
          service: newSlab.service,
          from: Number(newSlab.from),
          to: Number(newSlab.to),
          value: Number(newSlab.value),
          type: newSlab.type,
        })
      );

      const created =
        result?.payload?.data || result?.payload || result?.data || null;

      if (created && created.id) {
        setChargesData((prev) => [...prev, created]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Add commission failed", err);
      alert(err?.message || "Failed to add slab");
    }

    setNewSlab({
      from: "",
      to: "",
      value: "",
      type: "FIXED",
      role: "",
      service: "NEFT",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 mb-6 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Slab</h3>

      <div className="grid space-x-5 grid-cols-1 lg:grid-cols-7 ">
        {/* From */}
        <InputField
          name="from"
          inputType="number"
          placeholderName="From"
          valueData={newSlab.from}
          handleChange={(e) => setNewSlab({ ...newSlab, from: e.target.value })}
        />

        {/* To */}
        <InputField
          name="to"
          inputType="number"
          placeholderName="To"
          valueData={newSlab.to}
          handleChange={(e) => setNewSlab({ ...newSlab, to: e.target.value })}
        />

        {/* Value */}
        <InputField
          name="value"
          inputType="number"
          placeholderName="Value"
          valueData={newSlab.value}
          handleChange={(e) =>
            setNewSlab({ ...newSlab, value: e.target.value })
          }
        />

        {/* Type */}
        <SelectField
          name="type"
          label="Type"
          value={newSlab.type}
          handleChange={(e) => setNewSlab({ ...newSlab, type: e.target.value })}
          options={types.map((t) => ({ value: t, label: t }))}
        />

        {/* Service */}
        <SelectField
          name="service"
          label="Service"
          value={newSlab.service}
          handleChange={(e) =>
            setNewSlab({ ...newSlab, service: e.target.value })
          }
          options={services.map((s) => ({ value: s, label: s }))}
        />

        {/* Role */}
        <SelectField
          name="role"
          label="Role"
          value={newSlab.role}
          handleChange={(e) => setNewSlab({ ...newSlab, role: e.target.value })}
          options={[
            { value: "", label: "Select Role" },
            ...roles.map((r) => ({ value: r, label: r })),
          ]}
        />

        {/* Add Button */}
        <div className="flex justify-center items-end pb-1">
          <ButtonField
            type="submit"
            isDisabled={loading}
            icon={Plus}
            onClick={handleAddSlab}
            isOpen={null}
            name={"Submit"}
          />
        </div>
      </div>
    </div>
  );
};

export default AddCommission;
