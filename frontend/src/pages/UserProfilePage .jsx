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

const UserProfilePage = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulated API call
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Simulated API response based on your backend structure
        const mockUserData = {
          id: "user123",
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+91 9876543210",
          role: "USER",
          isActive: true,
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-09-01T15:45:00Z",
          bankDetails: {
            id: "bank123",
            accountHolder: "John Doe",
            bankName: "State Bank of India",
            ifscCode: "SBIN0001234",
            isVerified: true,
            accountNumber: "XXXXXXXXXXXX3456",
          },
          kycDetails: {
            id: "kyc123",
            panImage: "https://example.com/pan.jpg",
            aadhaarImageFront: "https://example.com/aadhaar-front.jpg",
            aadhaarImageBack: "https://example.com/aadhaar-back.jpg",
            fatherName: "Robert Doe",
            dob: "1990-05-15",
            homeAddress: "123 Main Street, Sector 1",
            shopName: "Doe Electronics",
            shopAddress: "456 Business Street, Market Area",
            district: "New Delhi",
            state: "Delhi",
            pinCode: "110001",
            kycStatus: "APPROVED",
            createdAt: "2024-01-20T09:00:00Z",
            updatedAt: "2024-02-01T14:30:00Z",
            panNumber: "XXXXX234F",
            aadhaarNumber: "XXXX XXXX XXXX 3456",
          },
        };

        setTimeout(() => {
          setUserData(mockUserData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to fetch user data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getStatusBadge = (status, isActive) => {
    if (status === "APPROVED" || isActive) {
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
    } else if (status === "REJECTED" || !isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {status || "Inactive"}
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className=" bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading user profile...</span>
        </div>
      </div>
    );
  }

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

  return (
    <div className=" bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-300 flex justify-between">
            <div className="flex items-center justify-between w-full">
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
                {/* Role Switcher for Demo */}

                {getStatusBadge(null, userData.isActive)}
              </div>
            </div>
            {onClose && <X onClick={onClose} />}
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
                  {userData.role}
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
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                    Bank Details
                  </h2>
                  {getStatusBadge(
                    userData.bankDetails.isVerified ? "APPROVED" : "PENDING"
                  )}
                </div>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Account Holder
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.bankDetails.accountHolder}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Bank Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.bankDetails.bankName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    IFSC Code
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {userData.bankDetails.ifscCode}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    Account Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {userData.bankDetails.accountNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KYC Details */}
          {userData.kycDetails && (
            <div className="bg-white shadow rounded-lg lg:col-span-1">
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    KYC Details
                  </h2>
                  {getStatusBadge(userData.kycDetails.kycStatus)}
                </div>
              </div>
              <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Father's Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.kycDetails.fatherName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(userData.kycDetails.dob).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    PAN Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {userData.kycDetails.panNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    Aadhaar Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {userData.kycDetails.aadhaarNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Home Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.kycDetails.homeAddress}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Shop Details
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.kycDetails.shopName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {userData.kycDetails.shopAddress}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      District
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userData.kycDetails.district}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      State
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userData.kycDetails.state}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    PIN Code
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.kycDetails.pinCode}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      KYC Created: {formatDate(userData.kycDetails.createdAt)}
                    </p>
                    <p>
                      Last Updated: {formatDate(userData.kycDetails.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Images Section */}
        {userData.kycDetails && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Document Images
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PAN Card */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    PAN Card
                  </label>
                  <div className="bg-gray-50 border rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={userData.kycDetails.panImage}
                      alt="PAN"
                      className="h-40 w-full object-contain bg-white"
                    />
                  </div>
                  <a
                    href={userData.kycDetails.panImage}
                    download="pan-card.jpg"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    ⬇️ Download
                  </a>
                </div>

                {/* Aadhaar Front */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Aadhaar Front
                  </label>
                  <div className="bg-gray-50 border rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={userData.kycDetails.aadhaarImageFront}
                      alt="Aadhaar Front"
                      className="h-40 w-full object-contain bg-white"
                    />
                  </div>
                  <a
                    href={userData.kycDetails.aadhaarImageFront}
                    download="aadhaar-front.jpg"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    ⬇️ Download
                  </a>
                </div>

                {/* Aadhaar Back */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Aadhaar Back
                  </label>
                  <div className="bg-gray-50 border rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={userData.kycDetails.aadhaarImageBack}
                      alt="Aadhaar Back"
                      className="h-40 w-full object-contain bg-white"
                    />
                  </div>
                  <a
                    href={userData.kycDetails.aadhaarImageBack}
                    download="aadhaar-back.jpg"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    ⬇️ Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
