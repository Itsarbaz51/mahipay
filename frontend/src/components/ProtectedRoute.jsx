import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser, isLoading } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    isAuthenticated &&
    !currentUser?.isKycVerified &&
    location.pathname !== "/kyc-submit"
  ) {
    return <Navigate to="/kyc-submit" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
