import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddCommission from "../components/forms/AddCommission";
import { getUserCommissions } from "../redux/slices/commissionSlice";
import CommissionTable from "../components/tabels/CommissionTable";

const CommissionCharges = () => {
  const dispatch = useDispatch();
  const { id } = useSelector((state) => state.auth.currentUser);
  const { commissions } = useSelector((state) => state.commission);

  const [chargesData, setChargesData] = useState([]);
  useEffect(() => {
    dispatch(getUserCommissions(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (commissions && Array.isArray(commissions)) {
      setChargesData(commissions);
    }
  }, [commissions]);

  const currentUser = useSelector((state) => state.auth?.currentUser);

  return (
    <div>
      {/* Form */}
      {currentUser.role === "ADMIN" && (
        <AddCommission
          chargesData={chargesData}
          setChargesData={setChargesData}
        />
      )}

      {/* Table */}
      <CommissionTable
        chargesData={chargesData}
        setChargesData={setChargesData}
      />
    </div>
  );
};

export default CommissionCharges;
