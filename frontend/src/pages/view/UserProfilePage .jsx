import { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getUserById } from "../../redux/slices/userSlice";
import { useParams } from "react-router-dom";

const UserProfilePage = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const { id } = useParams();

  // ✅ Read user data from Redux
  const userData = useSelector((state) => state.users.currentUser);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        await dispatch(getUserById(id))
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.message || "Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, dispatch]);

  console.log("User Data:", userData);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading user profile...</span>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <XCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // --- No Data ---
  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No user data found.
      </div>
    );
  }

  // --- Status Badge Helper ---
  const getStatusBadge = (status, isActive) => {
    if (status === "ACTIVE" || isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status || "Active"}
        </span>
      );
    } else if (status === "PENDING") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    } else if (status === "IN ACTIVE" || !isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {status || "Inactive"}
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Main UI ---
  return (
    <div className="bg-gray-50 py-8">
      <div>
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userData.name}
                </h1>
                <p className="text-gray-500">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(null, userData.status)}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                Basic Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  User ID
                </label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {userData.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Phone
                </label>
                <p className="mt-1 text-sm text-gray-900">{userData.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Role
                </label>
                <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Shield className="w-3 h-3 mr-1" />
                  {/* ✅ Safely handle role as string or object */}
                  {typeof userData.role === "object"
                    ? userData.role?.name || "N/A"
                    : userData.role || "N/A"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Created At
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(userData.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(userData.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {userData.bankDetails && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                  Bank Details
                </h2>
                {getStatusBadge(
                  userData.bankDetails.isVerified ? "APPROVED" : "PENDING"
                )}
              </div>
              <div className="px-6 py-4 space-y-4">
                <p>
                  <b>Account Holder:</b> {userData.bankDetails.accountHolder}
                </p>
                <p>
                  <b>Bank Name:</b> {userData.bankDetails.bankName}
                </p>
                <p>
                  <b>IFSC:</b> {userData.bankDetails.ifscCode}
                </p>
                <p>
                  <b>Account Number:</b> {userData.bankDetails.accountNumber}
                </p>
              </div>
            </div>
          )}

          {/* KYC Details */}
          {userData.kycDetails && (
            <div className="bg-white shadow rounded-lg lg:col-span-1">
              <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-600" />
                  KYC Details
                </h2>
                {getStatusBadge(userData.kycDetails.kycStatus)}
              </div>
              <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
                <p>
                  <b>Father's Name:</b> {userData.kycDetails.fatherName}
                </p>
                <p>
                  <b>DOB:</b>{" "}
                  {new Date(userData.kycDetails.dob).toLocaleDateString(
                    "en-IN"
                  )}
                </p>
                <p>
                  <b>PAN:</b> {userData.kycDetails.panNumber}
                </p>
                <p>
                  <b>Aadhaar:</b> {userData.kycDetails.aadhaarNumber}
                </p>
                <p>
                  <b>Address:</b> {userData.kycDetails.homeAddress}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Document Images */}
        {userData.kycDetails && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Document Images
              </h2>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "PAN Card", src: userData.kycDetails.panImage },
                {
                  label: "Aadhaar Front",
                  src: userData.kycDetails.aadhaarImageFront,
                },
                {
                  label: "Aadhaar Back",
                  src: userData.kycDetails.aadhaarImageBack,
                },
              ].map((doc, idx) => (
                <div key={idx} className="text-center">
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    {doc.label}
                  </label>
                  <div className="bg-gray-50 border rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={doc.src}
                      alt={doc.label}
                      className="h-40 w-full object-contain bg-white"
                    />
                  </div>
                  <a
                    href={doc.src}
                    download={`${doc.label
                      .toLowerCase()
                      .replace(" ", "-")}.jpg`}
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    ⬇️ Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
