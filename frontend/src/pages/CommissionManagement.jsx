import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import AddCommission from "../components/forms/AddCommission";
import CommissionTable from "../components/tabels/CommissionTable";
import { getCommissionSettingsByRoleOrUser } from "../redux/slices/commissionSlice";

const CommissionManagement = () => {
  const dispatch = useDispatch();
  const [chargesData, setChargesData] = useState([]);

  // Get commission settings from Redux store
  const commissionSettings = useSelector(
    (state) => state.commission.commissionSettings
  );
  const isLoading = useSelector((state) => state.commission.isLoading);

  // Fetch commission settings on component mount
  useEffect(() => {
    // You can pass specific roleId or userId here
    dispatch(getCommissionSettingsByRoleOrUser("", ""));
  }, [dispatch]);

  // Update local state when Redux state changes
  useEffect(() => {
    if (commissionSettings) {
      setChargesData(
        Array.isArray(commissionSettings) ? commissionSettings : []
      );
    }
  }, [commissionSettings]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Commission Management
      </h1>

      {/* Add Commission Form */}
      <AddCommission
        chargesData={chargesData}
        setChargesData={setChargesData}
      />

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
    </div>
  );
};

export default CommissionManagement;
