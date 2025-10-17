import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import Loader from "../components/Loader";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MainLayout = ({ currentUser, onLogout }) => {
  const loading = useSelector(
    (state) =>
      state.auth.isLoading ||
      state.kyc.isLoading ||
      state.user.isLoading ||
      state.bank.isLoading ||
      state.wallet.isLoading ||
      state.commission.isLoading
  );

  return (
    <div className="">
      {/* {loading && <Loader />}  */}
      <Sidebar currentUser={currentUser} onLogout={onLogout} />
      <div className="ml-64 flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 overflow-auto">
          <Outlet />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
