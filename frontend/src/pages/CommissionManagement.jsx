import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import AddCommissionModal from "../components/forms/AddCommission";
import CommissionTable from "../components/tabels/CommissionTable";
import { getCommissionSettingsByCreatedBy } from "../redux/slices/commissionSlice";

const CommissionManagement = () => {
  const dispatch = useDispatch();
  const [chargesData, setChargesData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get commission settings from Redux store
  const commissionSettings = useSelector(
    (state) => state.commission.commissionSettings
  );
  const isLoading = useSelector((state) => state.commission.isLoading);

  // Fetch commission settings on component mount
  useEffect(() => {
    dispatch(getCommissionSettingsByCreatedBy());
  }, [dispatch]);

  // Update local state when Redux state changes
  useEffect(() => {
    if (commissionSettings) {
      setChargesData(
        Array.isArray(commissionSettings) ? commissionSettings : []
      );
    }
  }, [commissionSettings]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    // Refresh the data
    dispatch(getCommissionSettingsByCreatedBy());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Commission Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage commission settings for roles and users
          </p>
        </div>

        {/* Add Commission Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors mt-4 md:mt-0"
        >
          <Plus className="w-5 h-5" />
          Add Commission Setting
        </button>
      </div>

      {/* Commission Table */}
      <CommissionTable
        chargesData={chargesData}
        setChargesData={setChargesData}
      />

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Add Commission Modal */}
      {showAddModal && (
        <AddCommissionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          chargesData={chargesData}
        />
      )}
    </div>
  );
};

export default CommissionManagement;
